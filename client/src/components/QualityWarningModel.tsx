import React from 'react';

interface QualityWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  qualityIssues: string[];
  issueType: string | null;
  noneResponseRate?: number;
  gibberishResponseRate?: number;
  fastResponseRate?: number;
}

export default function QualityWarningModal({ 
  isOpen, 
  onClose, 
  qualityIssues, 
  issueType,
  noneResponseRate = 0,
  gibberishResponseRate = 0,
  fastResponseRate = 0
}: QualityWarningModalProps) {
  if (!isOpen) return null;

  const getIssueDetails = () => {
  switch (issueType) {
    case 'none':
      return {
        icon: '🚨',
        title: 'High Rate of "None" Responses',
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        description: `You've answered "none" or "don't know" to ${noneResponseRate.toFixed(0)}% of questions.`,
        guidance: 'Even if practices vary, you likely have some knowledge about cultural norms in your region.'
      };
    case 'gibberish':
      return {
        icon: '⚠️',
        title: 'Low Quality Response Pattern',
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        description: `${gibberishResponseRate.toFixed(0)}% of your responses appear to be gibberish or random characters.`,
        guidance: 'Please provide meaningful responses about cultural practices in your region.'
      };
    case 'speed':
      return {
        icon: '🏃',
        title: 'Very Fast Response Pattern',
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fcd34d',
        description: `${fastResponseRate.toFixed(0)}% of your responses were completed very quickly (under 8 seconds).`,
        guidance: 'Please take time to read questions carefully and provide thoughtful answers. Quality responses typically take at least 15-30 seconds to write.'
      };
    case 'multiple':
      return {
        icon: '🔍',
        title: 'Multiple Quality Issues Detected',
        color: '#dc2626',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        description: 'We\'ve detected several response quality issues.',
        guidance: 'Please focus on providing detailed, thoughtful responses about cultural practices.'
      };
    default:
      return {
        icon: '🤔',
        title: 'Response Quality Check',
        color: '#d97706',
        bgColor: '#fffbeb',
        borderColor: '#fcd34d',
        description: 'Your response quality could be improved.',
        guidance: 'Please provide specific details about cultural practices in your region.'
      };
  }
};

  const issueDetails = getIssueDetails();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="max-w-lg mx-auto rounded-2xl shadow-2xl p-6 animate-bounce-in"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{issueDetails.icon}</div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {issueDetails.title}
          </h2>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            We want to help you provide valuable cultural insights
          </p>
        </div>

        {/* Content */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ 
            background: issueDetails.bgColor,
            border: `1px solid ${issueDetails.borderColor}`
          }}
        >
          <div className="flex items-start">
            <span className="mr-3 text-xl" style={{ color: issueDetails.color }}>
              ⚠️
            </span>
            <div>
              <p 
                className="font-medium mb-2"
                style={{ color: issueDetails.color }}
              >
                {issueDetails.description}
              </p>
              <p 
                className="text-sm mb-3"
                style={{ color: issueDetails.color }}
              >
                {issueDetails.guidance}
              </p>

              {qualityIssues.length > 0 && (
                <div className="text-xs" style={{ color: issueDetails.color }}>
                  <p className="font-medium mb-1">Specific issues detected:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {qualityIssues.slice(0, 4).map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Improvement Tips */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ 
            background: 'var(--tag-category-bg)',
            border: '1px solid var(--border-light)'
          }}
        >
          <h3 
            className="font-medium mb-2 text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            💡 How to improve your responses:
          </h3>
          <ul 
            className="text-xs space-y-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {issueType === 'none' && (
              <>
                <li>• Instead of "none", try: "In my region, we typically..." or "Usually people here..."</li>
                <li>• Use: "This isn't common in my area, but some people..." or "From what I've observed..."</li>
                <li>• Share: "Based on my experience..." or "While not universal, many people..."</li>
              </>
            )}
            {issueType === 'gibberish' && (
              <>
                <li>• Write complete words and sentences about cultural practices</li>
                <li>• Describe specific traditions, customs, or behaviors you've observed</li>
                <li>• Share examples from your personal experience or community knowledge</li>
              </>
            )}
            {issueType === 'speed' && (
              <>
                <li>• Read each question carefully and think about your personal experiences</li>
                <li>• Take at least 15-30 seconds to write a thoughtful response</li>
                <li>• Describe specific examples and details when you can</li>
                <li>• It's okay to take time to recall cultural practices from your region</li>
              </>
            )}
            {(issueType === 'multiple' || !issueType) && (
              <>
                <li>• Describe specific practices from your region with examples</li>
                <li>• Share your personal knowledge and observations</li>
                <li>• Take time to read questions carefully and provide thoughtful answers</li>
                <li>• Use complete sentences and avoid generic responses</li>
              </>
            )}
          </ul>
        </div>

        {/* Action Button - Only one option */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 font-medium rounded-xl transition-all duration-200"
            style={{ 
              background: 'var(--btn-primary-bg)',
              color: 'var(--text-on-dark)'
            }}
          >
            Let Me Improve My Responses
          </button>
        </div>

        {/* Encouragement */}
        <div className="mt-4 text-center">
          <p 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Your cultural knowledge is valuable! Even small details about your region 
            help preserve and understand India's diverse traditions.
          </p>
        </div>
      </div>
    </div>
  );
}