import { useState } from 'react'

function ShareButton({ generateUrl }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = generateUrl()

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="share-section">
      <button className="share-button" onClick={handleShare}>
        {copied ? 'Link Copied!' : 'Share Your Bag'}
      </button>
      <p className="share-hint">Copy link to share on Instagram or anywhere</p>
    </div>
  )
}

export default ShareButton
