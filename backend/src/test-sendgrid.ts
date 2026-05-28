import nodemailer from 'nodemailer';

const testSendGrid = async () => {
  // Let's use the exact Railway credentials from the user's screenshot
  const pass = 'SG.KyaHQVGCRqaR024MYA5Qsg.Fw-N7K5jlTYKIBvhAjhLxu@yrKE66CLRT5LxioHm47s';
  const from = 'hanssantoya@gmail.com';
  const to = 'svinceandrew@gmail.com';

  console.log('Testing SendGrid SMTP connection via Port 587...');
  const transporter587 = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: pass
    }
  });

  try {
    await transporter587.verify();
    console.log('✅ Port 587 connection verified successfully!');
  } catch (err: any) {
    console.error('❌ Port 587 connection failed:', err.message || err);
  }

  console.log('Testing SendGrid SMTP connection via Port 465...');
  const transporter465 = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true,
    auth: {
      user: 'apikey',
      pass: pass
    }
  });

  try {
    await transporter465.verify();
    console.log('✅ Port 465 connection verified successfully!');
  } catch (err: any) {
    console.error('❌ Port 465 connection failed:', err.message || err);
  }
};

testSendGrid();
