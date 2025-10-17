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
            
            {/* Invitation */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">INVITATION</h2>
              <p>
                You are invited to participate in a study that involves research. The purpose of this study is to examine regional variations in cultural commonsense knowledge across India. This research will contribute to the development of language models that better reflect diverse cultural perspectives.
              </p>
            </section>

            {/* What's Involved */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">WHAT'S INVOLVED</h2>
              <p className="mb-2">As a participant, you will be asked to:</p>
              <ol className="list-decimal list-inside space-y-2 mb-4">
                <li>Read and provide informed consent</li>
                <li>Provide your prolific ID</li>
                <li>Answer basic demographic questions (region in India, age, years spent in your region)</li>
                <li>Respond to 15 short-answer questions about cultural practices and commonsense knowledge specific to Indian regions</li>
              </ol>
              <p className="mb-2">
                Participation will take approximately 20 minutes of your time.
              </p>
              <p>
                You may enter "none" or "prefer not to answer" for any question you do not wish to answer substantively, though all questions require some form of response to submit the survey.
              </p>
            </section>

            {/* Potential Benefits and Risks */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">POTENTIAL BENEFITS AND RISKS</h2>
              
              <p className="mb-2">Possible benefits of participation include:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Your responses may help researchers understand how cultural knowledge varies across different regions of India</li>
                <li>Your responses may contribute to the development of AI systems and language models that better reflect diverse cultural perspectives and local knowledge</li>
              </ul>

              <p className="mb-2">There are minimal risks associated with participation:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Psychological risks:</strong> Questions may occasionally feel culturally sensitive, though questions have been carefully designed to avoid controversial or deeply personal topics. You may experience mild discomfort when answering questions about cultural practices.</li>
                <li><strong>Social/Privacy risks:</strong> Minimal privacy risk exists while raw responses containing your Prolific ID are under controlled access prior to de-identification. Only the research team (Principal Investigator and Primary Student Investigator) has access to this data, which is stored securely with password protection.</li>
              </ul>

              <p>
                These risks are mitigated through data minimization, secure password-protected storage with restricted access, clear transparency about data handling, your right to enter "none" or "prefer not to answer" for any question, and your right to withdraw and have your data deleted before the 31st of December, 2025.
              </p>
            </section>

            {/* Confidentiality */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">CONFIDENTIALITY</h2>
              <p className="mb-4">
                All information you provide is considered confidential. We do not collect direct identifiers like your name, email, or phone number. We will collect your Prolific ID (for payment and communication purposes only), demographic information (region in India, age, years spent in region), and your responses to cultural questions.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data Management:</h3>
              
              <p className="mb-2"><strong>Storage during collection:</strong> Data will be stored in a MongoDB Atlas password-protected cloud database (US-based servers, Google Cloud Platform, Iowa region) with access restricted to the PI and PSI only.</p>
              
              <p className="mb-2"><strong>Storage after collection:</strong> Data will be exported and stored securely on a password-protected file on Brock University OneDrive servers with access restricted to the PI and PSI only.</p>
              
              <p className="mb-4"><strong>Identifiers and anonymization:</strong> Prolific IDs will be removed from the dataset and data will be anonymized within 30 days of data collection. Participants may request to have their data deleted by December 31, 2025. After this date, individual responses cannot be linked back to participants.</p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data retention:</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Identifiable data (with Prolific IDs):</strong> Retained on secure Brock University OneDrive until December 31, 2025</li>
                <li><strong>Anonymized research dataset:</strong> Retained on Brock University OneDrive until approximately December 2026 for analysis and publication</li>
                <li><strong>Aggregated public dataset:</strong> A processed dataset may be made publicly available (expected June 2026) and will remain permanently accessible for research purposes and secondary data analysis. This public dataset will contain:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Regional categories only (North, South, East, West, Central India)</li>
                    <li>Representative consensus answers for each region based on synthesizing responses from multiple participants (approximately 10 per region)</li>
                    <li>No individual participant responses</li>
                    <li>No identifiable information</li>
                  </ul>
                </li>
                <li>All non-public versions of data will be permanently deleted from all storage systems by December 2026</li>
              </ul>

              <p className="mb-4">
                Your individual responses will be combined with others from your region to create representative regional answers. No individual responses will be published or identifiable.
              </p>

              <h3 className="text-lg font-semibold mb-2 text-custom-dark-brown">Data deletion:</h3>
              
              <div className="mb-4">
                <p className="mb-2"><strong>Upon withdrawal (before December 31, 2025):</strong> All individual data including Prolific ID and responses will be immediately and permanently deleted from all storage systems</p>
                <p className="mb-2"><strong>Deletion Steps:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Identification of records:</strong> Your Prolific ID will be used to locate all associated records in the active survey database (MongoDB Atlas) and any exported datasets stored on Brock University OneDrive.</li>
                  <li><strong>Deletion in primary storage:</strong> Your individual records will be deleted from MongoDB Atlas. Deletion will be verified by re-querying the database to confirm that no records remain.</li>
                  <li><strong>Deletion in secondary storage:</strong> Your individual records will be removed from exported files stored on OneDrive. Where version-controlled repositories are used, the deletion will be committed and prior versions containing your data will be removed from access (including repository recycle bins and history where feasible), and storage will be re-verified.</li>
                  <li><strong>Backups:</strong> Backups will be scheduled to expire and be replaced with sanitized datasets that no longer include your records.</li>
                  <li><strong>Confirmation:</strong> The research team will record the date, systems updated, and verification steps completed. You will receive a brief confirmation message via Prolific once deletions have been completed.</li>
                </ul>
              </div>

              <div className="mb-4">
                <p className="mb-2"><strong>After study completion:</strong> Identifiable data (Prolific IDs) will be permanently deleted by December 31, 2025</p>
                <p className="mb-2"><strong>Deletion Steps:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Anonymization:</strong> Prolific IDs and other direct identifiers will be removed from the dataset. Response data will be assigned anonymous study codes (e.g. "Participant_001").</li>
                  <li><strong>Removal of identifiable copies:</strong> Identifiable datasets will be deleted from OneDrive (including recycle bins and prior versions). MongoDB Atlas collections containing identifiers will be deleted.</li>
                  <li><strong>Recordkeeping:</strong> The completion of anonymization and deletion of identifiable data will be documented by the research team.</li>
                </ul>
              </div>

              <div className="mb-4">
                <p className="mb-2"><strong>All non-public data will be permanently deleted from Brock University OneDrive and all backup systems by December 2026</strong></p>
                <p className="mb-2"><strong>Deletion Steps:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Inventory and removal:</strong> All non-public versions of the dataset (including working files, exports, local caches, and backups) will be identified and permanently deleted from Brock University OneDrive and associated backup systems.</li>
                  <li><strong>Final verification:</strong> The research team will conduct a final search to confirm non-public data has been removed and will document completion. Public, aggregated datasets will remain available for research purposes and secondary analysis and do not contain identifiable information.</li>
                </ul>
              </div>

              <p className="mb-4">
                <strong>Consent for Secondary Data Use:</strong> By participating in this study, you consent to your responses being used to create aggregated, regional consensus answers that will be included in a public dataset. This public dataset may be used by other researchers for secondary data analysis and future research purposes. Your individual responses will not be identifiable in this public dataset.
              </p>

              <p>
                No identifying information will appear in any reports or publications.
              </p>
            </section>

            {/* Compensation */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">COMPENSATION</h2>
              <p className="mb-4">
                You will receive <strong>£3.50</strong> for completing this study. This compensation is based on an estimated completion time of 20 minutes, at a rate of <strong>£10.50/hour</strong>, in accordance with Prolific's fair payment guidelines.
              </p>
              <p className="mb-4">
                You will receive full compensation if you complete the study, which requires providing informed consent, completing the demographic questionnaire, and providing a response to all 15 cultural commonsense questions (you may enter "none" or "prefer not to answer" for questions you prefer to skip).
              </p>
              <p>
                All participants who complete these requirements will receive the full £3.50 compensation. Payment will be processed through Prolific's standard payment system.
              </p>
            </section>

            {/* Voluntary Participation */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">VOLUNTARY PARTICIPATION</h2>
              <p className="mb-4">
                Participation in this study is voluntary. If you wish, you may decline to answer any question substantively by entering "none" or "prefer not to answer." Further, you may decide to withdraw from this study at any time during the study period going live.
              </p>
              <p className="mb-4">
                <strong>Before December 31, 2025:</strong> If you choose to withdraw during this period (after completing the study), we will immediately delete all of your individual data from our systems, including your Prolific ID and all responses.
              </p>
              <p className="mb-4">
                <strong>After December 31, 2025:</strong> Once data has been anonymized (Prolific IDs removed), we will no longer be able to identify and delete your specific responses. However, your data will remain anonymous and cannot be linked back to you. We cannot remove anonymized contributions from published aggregate results, including the public dataset.
              </p>
              <p>
                To withdraw, please contact us through Prolific's private messaging system using your Prolific ID.
              </p>
            </section>

            {/* Publication of Results */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">PUBLICATION OF RESULTS</h2>
              <p className="mb-4">
                Results of this study may be published in professional journals and presented at conferences such as The 64th Annual Meeting of The Association for Computational Linguistics (ACL) 2026.
              </p>
              <p>
                If you would like to receive a summary of the study findings, please contact us through Prolific's private messaging system using your Prolific ID. Results are expected to be available approximately by January 2026 and publicly available by June 2026 upon acceptance and publication.
              </p>
            </section>

            {/* Contact Information and Ethics Clearance */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">CONTACT INFORMATION AND ETHICS CLEARANCE</h2>
              <p className="mb-4">
                If you have any questions about this study or require further information, please contact us through Prolific's private messaging system using your Prolific ID.
              </p>
              <p>
                This study has been reviewed and received ethics clearance through the Research Ethics Board at Brock University (File #25-079). If you have any comments or concerns about your rights as a research participant, please contact the Office of Research Ethics at (905) 688-5550 Ext. 3035, reb@brocku.ca.
              </p>
              <p className="mt-4">
                Thank you for your assistance in this project.
              </p>
            </section>

            {/* Consent */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-custom-dark-brown">CONSENT</h2>
              <p className="mb-2">By clicking "I agree" below, I confirm that:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>I have read and understood the information provided above</li>
                <li>I have had the opportunity to ask questions and receive additional details about the study</li>
                <li>I understand that my participation is voluntary, and I may withdraw at any time before data anonymization (December 31, 2025)</li>
                <li>I understand and consent to my anonymized, aggregated responses being included in a public dataset that may be used by other researchers for future research purposes</li>
              </ul>
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
            ✓ I Agree
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
            By clicking "I Agree", you acknowledge that you have read and understood this consent form and agree to participate in this research study.
          </p>
        </div>
      </div>
    </div>
  );
}