import { useState } from 'react'

function ShareButton({ generateUrl, playerName }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = generateUrl()
    const title = playerName ? `${playerName}'s Disc Golf Bag` : 'My Disc Golf Bag'
    const text = 'Check out my disc golf bag!'

    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        })
        return
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        if (err.name === 'AbortError') return
      }
    }

    // Fallback: copy to clipboard
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
      <p className="share-hint">Share your read-only bag link</p>
    </div>
  )
}

export default ShareButton
