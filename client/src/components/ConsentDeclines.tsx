import React, { useEffect } from 'react';

export default function ConsentDeclined() {
  const prolificCode = 'C16E1F79';

  // Prevent refresh/back button
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Please do not refresh this page. Use the Prolific code to return the survey.';
      return 'Please do not refresh this page. Use the Prolific code to return the survey.';
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
    };

    // Prevent back button
    window.history.pushState(null, '', window.location.href);
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prolificCode);
    alert('Prolific code copied to clipboard!');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-4xl mx-auto rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Thank You
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full mb-6"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
          <p 
            className="text-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            You have chosen not to participate in this research study.
          </p>
        </div>

        {/* Prolific Code Section */}
        <div 
          className="border-l-4 p-6 rounded-r-lg mb-8"
          style={{ 
            backgroundColor: 'var(--color-blue-gray-changed)',
            borderColor: 'var(--color-olive)'
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Please Return This Survey on Prolific
          </h2>
          <p 
            className="text-lg mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Use this code to return the survey:
          </p>
          <div 
            className="bg-white border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-50 text-center"
            style={{ borderColor: 'var(--color-olive)' }}
            onClick={copyToClipboard}
          >
            <span className="text-2xl font-mono font-bold text-gray-800">
              {prolificCode}
            </span>
          </div>
          <div className="text-center">
            <button
              onClick={copyToClipboard}
              className="px-6 py-2 bg-white font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--color-olive)' }}
            >
              📋 Copy Code
            </button>
          </div>
        </div>

        {/* What Happens Next */}
        <div 
          className="border-l-4 p-6 rounded-r-lg mb-8"
          style={{ 
            backgroundColor: 'var(--color-cream)',
            borderColor: 'var(--color-olive)'
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            What happens next?
          </h2>
          <ul 
            className="list-disc list-inside space-y-2 text-custom-dark-brown"
            style={{ color: 'var(--text-secondary)' }}
          >
            <li>No data has been collected from you</li>
            <li>You will not be contacted again about this study</li>
            <li>Simply return the survey on Prolific using the code above</li>
            <li>You can now safely close this browser tab</li>
          </ul>
        </div>

        {/* Your Decision is Respected */}
        <div 
          className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg mb-8"
        >
          <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">
            Your Decision is Respected
          </h2>
          <p className="text-custom-dark-brown">
            Participation in research is always voluntary. Your choice to decline participation 
            is completely acceptable and respected. Thank you for taking the time to consider 
            our study.
          </p>
        </div>

        {/* Final Message */}
        <div className="text-center mt-10">
          <p 
            className="text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Thank you for considering our research study.
          </p>
          <p 
            className="text-sm mt-2 text-custom-olive"
          >
            Don't forget to use the Prolific code above to return the survey.
          </p>
        </div>
      </div>
    </div>
  );
}