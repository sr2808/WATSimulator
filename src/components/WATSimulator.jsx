import { useState, useEffect, useRef } from 'react'

export default function WATSimulator() {
  const [screen, setScreen] = useState('input') // 'input' | 'countdown' | 'running' | 'completed'
  const [inputText, setInputText] = useState('')
  const [words, setWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [countdownValue, setCountdownValue] = useState(3)
  const audioContextRef = useRef(null)
  const [showAbout, setShowAbout] = useState(false)

  // Parse input text into words
  const parseInput = (text) => {
    if (!text.trim()) return []
    
    const lines = text.split('\n').filter(line => line.trim())
    let parsed = []
    
    lines.forEach(line => {
      // Remove numbering (1., 2), etc.), bullets (-, •, *)
      const cleaned = line
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[-•*]\s*/, '')
        .trim()
      
      // Check if line contains commas
      if (cleaned.includes(',')) {
        const commaSplit = cleaned.split(',')
          .map(w => w.trim())
          .filter(w => w.length > 0)
        parsed.push(...commaSplit)
      } else if (cleaned) {
        parsed.push(cleaned)
      }
    })

    // If no newlines, try comma separation on whole text
    if (parsed.length === 0) {
      parsed = text.split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0)
    }

    return parsed
  }

  const startWAT = () => {
    const parsed = parseInput(inputText)
    
    if (parsed.length === 0) {
      alert('⚠️ Please enter at least one word!')
      return
    }
    
    setWords(parsed)
    setCurrentIndex(0)
    setTimeLeft(15)
    setCountdownValue(3)
    setScreen('countdown')
  }

  // Initialize Web Audio Context
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.log('Web Audio API not supported:', error)
    }
  }, [])

  // Play beep sound
  const playBeep = () => {
    if (!audioContextRef.current) return
    
    try {
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      const beepDuration = 0.2
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + beepDuration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + beepDuration)
    } catch (error) {
      console.log('Error playing beep:', error)
    }
  }

  // Countdown logic (3, 2, 1, START)
  useEffect(() => {
    if (screen !== 'countdown') return

    if (countdownValue === 0) {
      // Play beep and start the test
      playBeep()
      setScreen('running')
      return
    }

    const timer = setTimeout(() => {
      playBeep()
      setCountdownValue(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [screen, countdownValue])

  // Timer logic for word display
  useEffect(() => {
    if (screen !== 'running') return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up for current word
          if (currentIndex < words.length - 1) {
            // Move to next word
            playBeep()
            setCurrentIndex(prevIndex => prevIndex + 1)
            return 15
          } else {
            // All words completed
            playBeep()
            setScreen('completed')
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [screen, currentIndex, words.length])

  // Handle Escape key to exit
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && (screen === 'running' || screen === 'countdown')) {
        if (confirm('Are you sure you want to exit the session?')) {
          setScreen('input')
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [screen])

  // Handle Escape key to close About modal on input screen
  useEffect(() => {
    if (!showAbout) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowAbout(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showAbout])

  const reset = () => {
    setScreen('input')
    setInputText('')
    setWords([])
    setCurrentIndex(0)
    setTimeLeft(15)
    setCountdownValue(3)
  }

  // INPUT SCREEN
  if (screen === 'input') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white/5 border-2 border-white/20 rounded-lg p-6 md:p-8 relative">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-3 tracking-wider">
              WAT SIMULATOR
            </h1>
            <p className="text-white/70 text-xs md:text-sm uppercase tracking-widest">
              Word Association Test Practice
            </p>
          </div>

          {/* About button (top-right) */}
          <button
            onClick={() => setShowAbout(true)}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm"
            aria-label="About this tool"
          >
            ℹ️ About
          </button>

          {/* Input Section */}
          <div className="mb-6">
            <label className="block text-white/80 font-semibold mb-3 text-sm uppercase">
              Enter Words:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter words (one per line or comma-separated):&#10;&#10;1. Book&#10;2. Study&#10;3. Education&#10;&#10;Or: Book, Study, Education"
              className="w-full h-48 md:h-64 bg-black/50 text-white border-2 border-white/30 rounded p-4 focus:outline-none focus:border-white resize-none placeholder-white/30 text-sm md:text-base"
              autoFocus
            />
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
            <p className="text-white/60 text-xs md:text-sm">
              💡 <strong>Test Instructions:</strong> You will see a countdown (3, 2, 1, START), 
              then each word will display for 15 seconds with a beep sound between words. 
              Press ESC to exit during the test.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={startWAT}
            className="w-full bg-white text-black font-bold py-3 md:py-4 px-6 rounded-lg uppercase tracking-widest text-base md:text-lg hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95"
          >
            Start WAT ▶
          </button>

          {/* Info */}
          <div className="mt-6 text-center text-white/60 text-xs space-y-1">
            <p>⏱ Each word displays for 15 seconds</p>
            <p>🔊 Beep plays between words</p>
            <p>⏳ Countdown: 3, 2, 1, START before test begins</p>
            <p>⌨️ Press ESC to exit anytime</p>
          </div>

          {/* About Modal */}
          {showAbout && (
            <div
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fadeIn"
              onClick={() => setShowAbout(false)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="bg-white/5 border-2 border-white/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 relative text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setShowAbout(false)}
                  className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
                  aria-label="Close about dialog"
                >
                  ×
                </button>

                {/* Content */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  About This Tool
                </h2>

                <div className="space-y-6 text-white/80 text-sm md:text-base">
                  <p>
                    This WAT Simulator is a free educational tool created for defense aspirants preparing for SSB (Services Selection Board) interviews.
                  </p>

                  <div>
                    <h3 className="font-semibold text-white mb-2">🎯 Purpose</h3>
                    <p>
                      This tool is my contribution to help aspiring officers practice Word Association Tests in a realistic environment. It is provided completely free of charge for educational purposes only.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">⚠️ Ethical Use</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>For personal practice and self-improvement only</li>
                      <li>Not for commercial purposes or resale</li>
                      <li>Not for cheating or malpractice during actual tests</li>
                      <li>Respect the spirit of honest preparation</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">👨‍💻 Developer</h3>
                    <p>
                      Created by: <span className="text-white">Sumit Rai</span><br />
                      Contact: <a href="mailto:raisumit585@gmail.com" className="underline text-white/80 hover:text-white">raisumit585@gmail.com</a>
                    </p>
                    <p className="mt-2">For feedback, suggestions, or reporting issues, feel free to reach out.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">📜 Copyright & Legal</h3>
                    <p>© 2024 Sumit Rai. All rights reserved.</p>
                    <p className="mt-2">
                      This tool is provided "as-is" without any warranties. The developer is not responsible for how this tool is used. This is not an official SSB preparation tool and is not affiliated with any defense organization.
                    </p>
                    <p className="mt-2">Do not redistribute, modify, or use this tool for commercial purposes without explicit permission.</p>
                  </div>

                  <p className="text-white mt-2">🇮🇳 Jai Hind!</p>
                </div>

                {/* Close button at bottom */}
                <button
                  onClick={() => setShowAbout(false)}
                  className="mt-8 w-full bg-white text-black py-3 px-6 rounded-lg font-bold uppercase tracking-widest hover:bg-white/90"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // COUNTDOWN SCREEN (3, 2, 1, START)
  if (screen === 'countdown') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center animate-fadeIn">
          <p className="text-white/60 text-xl md:text-2xl mb-8 uppercase tracking-wide">
            WAT will begin in
          </p>
          <div className="text-white text-8xl md:text-9xl font-bold">
            {countdownValue === 0 ? 'START' : countdownValue}
          </div>
        </div>
      </div>
    )
  }

  // RUNNING SCREEN
  if (screen === 'running') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-8 relative">
        {/* Screen reader only */}
        <span className="sr-only">
          Word {currentIndex + 1} of {words.length}. Press Escape to exit.
        </span>
        
        {/* Word Display */}
        <div className="text-center max-w-5xl w-full animate-fadeIn">
          <div className="border-4 border-white/30 rounded-2xl p-8 md:p-16">
            <p className="text-white text-4xl md:text-7xl font-bold tracking-wider uppercase break-words">
              {words[currentIndex]}
            </p>
          </div>
        </div>

        {/* Exit hint */}
        <div className="absolute bottom-4 right-4 text-white/20 text-xs">
          ESC to exit
        </div>

        {/* Progress indicator */}
        <div className="absolute top-4 left-4 text-white/20 text-xs">
          {currentIndex + 1} / {words.length}
        </div>
      </div>
    )
  }

  // COMPLETED SCREEN
  if (screen === 'completed') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-2xl w-full animate-fadeIn">
          <div className="bg-white/5 border-2 border-white/20 rounded-lg p-8 md:p-12">
            {/* Success Icon */}
            <div className="text-5xl md:text-6xl mb-6">✓</div>
            
            {/* Title */}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-wider">
              SESSION COMPLETED
            </h2>
            
            {/* Stats */}
            <p className="text-white/70 text-lg md:text-xl mb-2">
              {words.length} word{words.length !== 1 ? 's' : ''} completed
            </p>
            
            {/* Message */}
            <p className="text-white/70 text-xl md:text-2xl mb-8 tracking-wide">
              JAI HIND 🇮🇳
            </p>
            
            {/* Action Button */}
            <button
              onClick={reset}
              className="bg-white text-black font-bold py-3 px-8 rounded-lg uppercase tracking-widest hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    )
  }
}