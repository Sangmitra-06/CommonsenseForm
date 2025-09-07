import React, { useState } from 'react';

interface ConsentFormProps {
  onConsent: () => void;
  onDecline: () => void;
}

export default function ConsentForm({ onConsent, onDecline }: ConsentFormProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isScrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-4xl mx-auto rounded-2xl shadow-xl p-8 md:p-12"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div className="text-center mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Research Consent Form
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        <div 
          className="max-h-96 overflow-y-auto pr-4 space-y-6 mb-8 border rounded-lg p-6"
          style={{ backgroundColor: 'var(--color-cream)' }}
          onScroll={handleScroll}
        >
          <div className="prose prose-sm max-w-none text-custom-dark-brown">
            
            {/* Potential Benefits */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Potential Benefits</h2>
              <p className="mb-2">By participating in this study:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your responses will help researchers understand how cultural knowledge varies across different regions of India.</li>
                <li>Your responses will contribute to the development of AI systems and language models that better reflect diverse cultural perspectives and local knowledge.</li>
              </ul>
            </section>

            {/* Possible Risks */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Possible Risks</h2>
              <p className="mb-2">There are minimal risks associated with this study. However, the few risks associated with this study are as follows:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Questions may occasionally feel sensitive in a cultural sense even though no direct identifiers are requested, which is mitigated by data minimization and plain‑language transparency</li>
                <li>Minimal privacy risk remains while raw responses are under controlled access prior to de‑identification</li>
              </ul>
            </section>

            {/* Withdrawal Process */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Withdrawal Process</h2>
              <p className="mb-4">
                Participation in this study is completely voluntary, and you may withdraw at any time without penalty. Should you choose to withdraw before publication, we will immediately delete all of your individual data from our systems. After publication, while we can still delete your individual raw data from our systems, we cannot remove your anonymized contributions from published aggregate results such as statistical analyses, figures, or overall findings, as this data will have been combined with other participants' data.
              </p>
              <p>
                To withdraw from the study or exercise any of your data rights, please contact us through Prolific's private messaging system using your Prolific ID.
              </p>
            </section>

            {/* Confidentiality */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Confidentiality</h2>
              <p className="mb-4">
                All collected data will remain confidential. We do not collect direct identifiers like your name, email, or phone number. Demographic data regarding regional familiarity, age, and Prolific ID will be collected.
              </p>
              <p>
                Data will always be stored securely using password protection and restricted access to only those involved in this study, as well, all data will be used solely for research purposes. No identifying information will appear in any reports or publications.
              </p>
            </section>

            {/* Legal Framework and Your Rights */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Legal Framework and Your Rights</h2>
              <p className="mb-4">
                This research operates under your explicit consent and complies with GDPR and PIPEDA requirements.
              </p>
              
              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data Categories:</h3>
              <p className="mb-2">We collect:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Prolific ID (for payment and communication)</li>
                <li>Region of India you're from</li>
                <li>Age</li>
                <li>Years spent in your region</li>
                <li>Your responses to cultural questions</li>
              </ul>

              <p className="mb-4">
                Your personal data (Prolific ID and responses) will be processed solely for scientific research purposes to advance understanding of regional knowledge. Please note that data will be stored on US-based servers (GitHub for secure storage) under appropriate privacy safeguards including Standard Contractual Clauses and API configurations that prevent your data from being used for model training.
              </p>

              <p className="mb-2">Under data protection laws, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>Access your personal data.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request the deletion of your data. (subject to publication limitations noted above)</li>
                <li>Restrict the processing of your data.</li>
                <li>Data portability.</li>
                <li>Withdraw your consent at any time.</li>
                <li>Lodge a complaint with a supervisory authorities in Canada or the EU.</li>
              </ul>

              <p>
                You can exercise these rights by contacting us through Prolific's private messaging system using your Prolific ID.
              </p>
            </section>

            {/* Privacy and Data Sharing Policies */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Privacy and Data Sharing Policies</h2>
              <p className="mb-4">
                This policy outlines how your data is handled during our research study using a third-party large language model (LLM) service to review response quality. Please read carefully.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data Collection and Usage:</h3>
              <p className="mb-4">
                We collect your Prolific ID for payment, your choice of region, your answers to the common-sense questions, and voluntary demographic data (e.g., age range). This data will be used for research analysis, quality control, compensation administration, and the preparation of aggregate, anonymized publications or datasets. No automated decision-making that produces legal or similarly significant effects is performed.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">International Data Transfers:</h3>
              <p className="mb-2">As a Canadian institution, your data will be processed in Canada and transferred to:</p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>US-based servers (GitHub, LLM services)</li>
                <li>Adequate protection ensured through Standard Contractual Clauses</li>
                <li>Technical safeguards prevent unauthorized access or commercial use</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data Retention and Deletion:</h3>
              <p className="mb-4">
                Collected data will be stored by the research team for the duration of the research study and will continue to be stored after the completion of the study for the purpose of reanalysis. Upon publication of the subsequent work, any collected data will be deleted in its entirety. Should you wish to withdraw from the study, any collected data stored by the research team will immediately be deleted. Your responses to the questions that are stored in the LLM service may be retained for up to 30 days, post which, it will be deleted. In the event of a withdrawal, data stored by this service cannot be guaranteed to be deleted until the 30 day period has elapsed.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data Security, Sharing and Third-Party Processing:</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Research team:</strong> Only authorized team members have access to your complete data</li>
                <li><strong>LLM service:</strong> The LLM service used for response analysis receives only your responses, region, and years in region for evaluation purposes. They do not receive your Prolific ID or other identifying information</li>
                <li><strong>Security measures:</strong> All data is encrypted in transit and at rest, stored in password-protected systems</li>
                <li><strong>No commercial use:</strong> Your data will not be used for commercial purposes or to train AI models for commercial applications</li>
              </ul>

              <p>
                By participating, you agree to this policy and the use of third-party services.
              </p>
            </section>

            {/* Compensation */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Compensation</h2>
              
              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Rate:</h3>
              <p className="mb-4">
                You will be compensated <strong>€3.50</strong> for <strong>20</strong> minutes of participation, at a rate of <strong>€10.50/hour</strong>
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Contingency:</h3>
              <p>
                Compensation is contingent upon completing all study tasks and adhering to attention checks within the form. Participants who do not complete the full study or who do not demonstrate substantive engagement with the tasks may not receive compensation, in accordance with Prolific's submission guidelines. Submissions are manually reviewed prior to release of payment.
              </p>
            </section>

            {/* Publication of results */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Publication of Results</h2>
              <p>
                The results of this research project may be published and presented at conferences such as The 19th Conference of the European Chapter of the Association for Computational Linguistics, 2026.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">Contact Information</h2>
              <p>
                If you have questions or concerns about the study, please reach out via Prolific's private messaging system using your Prolific ID.
              </p>
            </section>

          </div>
        </div>

        {/* Scroll indicator */}
        {!hasScrolled && (
          <div className="text-center mb-6">
            <p className="text-sm text-custom-olive animate-pulse">
              Please scroll through the entire consent form above before proceeding
            </p>
          </div>
        )}

        {/* Consent Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onConsent}
            disabled={!hasScrolled}
            className={`font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl ${
              hasScrolled 
                ? 'opacity-100 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ 
              background: hasScrolled ? 'var(--btn-primary-bg)' : '#cccccc',
              color: 'var(--text-on-dark)'
            }}
          >
            ✓ I Consent to Participate
          </button>
          
          <button
            onClick={onDecline}
            className="font-medium py-3 px-6 rounded-lg text-base transition-all duration-200 border-2"
            style={{ 
              backgroundColor: 'transparent',
              borderColor: 'var(--color-olive)',
              color: 'var(--color-olive)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-olive)';
              e.currentTarget.style.color = 'var(--text-on-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-olive)';
            }}
          >
            Decline to Participate
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-custom-olive">
            By clicking "I Consent to Participate", you acknowledge that you have read and understood this consent form and agree to participate in this research study.
          </p>
        </div>
      </div>
    </div>
  );
}