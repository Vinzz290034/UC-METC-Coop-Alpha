import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const TermsOfUsePage: React.FC = () => {
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
      <div className="max-w-4xl mx-auto w-full mt-12 relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-6">Terms of Use</h1>
          
          <div className="space-y-6 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the UC METC SILMS (System for Integrated Locker Management and Member Services) platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on the UC METC SILMS platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on the platform</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">3. Disclaimer</h2>
              <p>
                The materials on the UC METC SILMS platform are provided on an 'as is' basis. UC METC makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">4. Limitations</h2>
              <p>
                In no event shall UC METC or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the UC METC SILMS platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on the UC METC SILMS platform could include technical, typographical, or photographic errors. UC METC does not warrant that any of the materials on the platform are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">6. Links</h2>
              <p>
                UC METC has not reviewed all of the sites linked to its platform and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by UC METC of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">7. Modifications</h2>
              <p>
                UC METC may revise these terms of use for its platform at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms of use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the Philippines, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-800 mb-3">9. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Use, please contact us at info@uc-metc.edu.ph.
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
