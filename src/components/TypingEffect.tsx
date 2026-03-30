import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  words: string[];
  className?: string;
  speed?: number;
  deleteSpeed?: number;
  delayBetweenWords?: number;
}

const styles = `
  @keyframes blink-cursor {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  
  .typing-cursor {
    animation: blink-cursor 1s infinite;
    margin-left: 2px;
  }
`;

export const TypingEffect: React.FC<TypingEffectProps> = ({
  words,
  className = '',
  speed = 80,
  deleteSpeed = 40,
  delayBetweenWords = 1500,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  // Alternate between green and purple
  const colors = ['#16a34a', '#a855f7']; // green-600, purple-600
  const currentColor = colors[wordIndex % colors.length];

  useEffect(() => {
    const currentWord = words[wordIndex];
    let timer: NodeJS.Timeout;

    if (isWaiting) {
      // Wait between words
      timer = setTimeout(() => {
        setIsWaiting(false);
        setIsDeleting(true);
      }, delayBetweenWords);
    } else if (isDeleting) {
      // Delete character
      if (displayText.length > 0) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        // Move to next word
        setWordIndex((prev) => (prev + 1) % words.length);
        setIsDeleting(false);
      }
    } else {
      // Type character
      if (displayText.length < currentWord.length) {
        timer = setTimeout(() => {
          const nextChar = currentWord[displayText.length];
          setDisplayText(displayText + nextChar);
        }, speed);
      } else {
        // Word is complete, wait before deleting
        setIsWaiting(true);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIndex, isWaiting, words, speed, deleteSpeed, delayBetweenWords]);

  return (
    <>
      <style>{styles}</style>
      <span
        className={className}
        style={{
          color: currentColor,
          transition: 'color 0.3s ease-in-out',
        }}
      >
        {displayText}
        <span
          className="typing-cursor"
          style={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            backgroundColor: currentColor,
            marginLeft: '4px',
          }}
        />
      </span>
    </>
  );
};
