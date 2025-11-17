import { db } from '../lib/firebaseAdmin';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { email, name, requestReason } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      const request = {
        email,
        name,
        requestReason: requestReason || 'Not specified',
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null,
        inviteCode: null,
      };

      const docRef = await db.collection('access_requests').add(request);

      // Notify admin
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_EMAIL,
          subject: 'New Access Request - ' + name,
          htmlContent: `<p>${name} (${email}) has requested access.</p><p>Reason: ${requestReason}</p>`,
          type: 'admin-notification',
          data: { requestId: docRef.id },
        }),
      });

      return res.status(201).json({
        success: true,
        requestId: docRef.id,
        message: 'Access request submitted',
      });
    }
    else if (req.method === 'PUT') {
      const { requestId, action, inviteCode, adminId } = req.body;

      if (!requestId || !action) {
        return res.status(400).json({ error: 'requestId and action are required' });
      }

      const updateData = {
        status: action,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
      };

      if (action === 'approved' && inviteCode) {
        updateData.inviteCode = inviteCode;
      }

      const requestDoc = await db.collection('access_requests').doc(requestId).get();
      const requestData = requestDoc.data();

      await db.collection('access_requests').doc(requestId).update(updateData);

      const emailSubject = action === 'approved'
        ? 'Your Access Request Has Been Approved'
        : 'Your Access Request Has Been Declined';

      const emailContent = action === 'approved'
        ? `<p>Your access has been approved! Your invitation code is: <strong>${inviteCode}</strong></p><p>Visit signup page to create your account.</p>`
        : '<p>Your access request has been declined. Please contact the administrator.</p>';

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: requestData.email,
          subject: emailSubject,
          htmlContent: emailContent,
          type: action === 'approved' ? 'approval' : 'rejection',
          data: { requestId },
        }),
      });

      return res.status(200).json({
        success: true,
        message: `Request ${action}ed successfully`,
      });
    }
    else if (req.method === 'GET') {
      const status = req.query.status;

      let query = db.collection('access_requests').orderBy('createdAt', 'desc');

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        success: true,
        count: requests.length,
        requests,
      });
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Request approval error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message,
    });
  }
}
