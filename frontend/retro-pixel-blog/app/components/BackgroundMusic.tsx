'use client';

import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true); // 默认为播放状态
  const [volume, setVolume] = useState(0.3);
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);

  // 初始化音频上下文和节点
  useEffect(() => {
    // 在页面加载后延迟1秒显示提示
    const timer = setTimeout(() => {
      setShowPlayPrompt(true);
    }, 1000);

    // 创建一个用于检测用户交互的事件监听器
    const handleUserInteraction = () => {
      if (!audioRef.current) return;
      
      // 尝试播放
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayFailed(false);
          setShowPlayPrompt(false);
          // 成功后移除事件监听器
          removeEventListeners();
        })
        .catch(e => {
          console.log('交互后播放失败:', e);
        });
    };

    // 添加各种用户交互事件监听器
    const addEventListeners = () => {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
    };

    // 移除所有事件监听器
    const removeEventListeners = () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    // 添加事件监听器
    addEventListeners();

    // 清理函数
    return () => {
      clearTimeout(timer);
      removeEventListeners();
    };
  }, []);

  // 尝试自动播放
  useEffect(() => {
    if (!audioRef.current) return;

    const playAttempt = () => {
      audioRef.current?.play()
        .then(() => {
          console.log('自动播放成功');
          setIsPlaying(true);
          setShowPlayPrompt(false);
        })
        .catch(e => {
          console.log('自动播放被阻止:', e);
          setAutoplayFailed(true);
        });
    };

    // 立即尝试
    playAttempt();

    // 尝试几次，有时第一次失败但后续尝试可能成功
    const attempts = [100, 500, 1000, 2000];
    attempts.forEach(delay => {
      setTimeout(playAttempt, delay);
    });
  }, []);

  // 音量调整
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 播放/暂停切换
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayFailed(false);
          setShowPlayPrompt(false);
        })
        .catch(e => {
          console.log('播放失败:', e);
        });
    }
  };

  // 音量调整
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <>
      {/* 添加全屏点击提示 */}
      {showPlayPrompt && (
        <div 
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setAutoplayFailed(false);
                  setShowPlayPrompt(false);
                })
                .catch(e => console.log('提示点击后播放失败', e));
            }
          }}
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 cursor-pointer"
        >
          <div className="bg-gray-900 p-8 rounded-lg border border-green-400 pixelated-border max-w-md text-center">
            <h2 className="text-green-400 font-squares text-xl mb-4">开始您的体验</h2>
            <p className="text-green-300 font-elvpixels03 mb-6">点击此处启动背景音乐和完整体验</p>
            <div className="animate-pulse text-lg text-green-400">
              点击以继续 →
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-gray-800 bg-opacity-70 p-2 rounded-lg border border-green-400 pixelated-border">
        <audio
          ref={audioRef}
          src="/Happy Jumping Creatures (Funky Electronic Hip Hop) - Drums and Bass.wav"
          loop
        />

        {autoplayFailed && !showPlayPrompt && (
          <div className="animate-pulse mr-2 text-green-400 text-xs font-elvpixels03">
            点击播放音乐
          </div>
        )}

        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center text-green-400 hover:text-green-300 focus:outline-none"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-16 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </>
  );
};

export default BackgroundMusic; 