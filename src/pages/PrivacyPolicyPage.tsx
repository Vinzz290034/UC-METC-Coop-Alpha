import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col p-4 relative"
      style={{
        backgroundImage: 'url(/src/assets/Background2.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Green to White to Purple Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-400/60 via-white/30 to-purple-900/70"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 bg-purple-600 text-white hover:bg-purple-700 transition-all group z-20 p-2 rounded-lg shadow-lg"
        title="Back to Landing Page"
      >
        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto w-full mt-8 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4 text-slate-700">
            <h1 className="text-4xl font-bold text-slate-800">Privacy Policy</h1>
            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3 -mt-8">1. Introduction</h2>
              <p>
                UC METC SILMS ("we", "us", "our", or "Company") operates the UC METC SILMS platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">2. Information Collection and Use</h2>
              <p>
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              <h3 className="text-lg font-semibold text-slate-700 mt-3 mb-2">Types of Data Collected:</h3>
              <ul className="list-disc list-inside ml-4">
                <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:
                  <ul className="list-disc list-inside ml-6 mt-2">
                    <li>Email address</li>
                    <li>First name and last name</li>
                    <li>Phone number</li>
                    <li>Address, City, State, Province, ZIP/Postal code, Country</li>
                    <li>Cookies and Usage Data</li>
                  </ul>
                </li>
                <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used ("Usage Data"). This may include information such as your IP address, browser type, browser version, the pages you visit, the time and date of your visit, and other diagnostic data.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">3. Use of Data</h2>
              <p>
                UC METC SILMS uses the collected data for various purposes:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer support</li>
                <li>To gather analysis or valuable information so that we can improve our Service</li>
                <li>To monitor the usage of our Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">4. Security of Data</h2>
              <p>
                The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">5. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>UC METC SILMS</strong><br />
                Email: info@uc-metc.edu.ph<br />
                Address: University of Cebu, Philippines
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">7. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc list-inside ml-4">
                <li>Access the personal data we hold about you</li>
                <li>Correct or update your personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Opt out of receiving marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">8. Data Retention</h2>
              <p>
                UC METC SILMS will retain your Personal Data only for as long as necessary for the purposes set out in this Privacy Policy. We will retain and use your Personal Data to the extent necessary to comply with our legal obligations.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 font-semibold underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
