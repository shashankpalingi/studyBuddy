import { useEffect, useState } from 'react';

interface PreloaderProps {
  onLoadComplete?: () => void;
}

const Preloader = ({ onLoadComplete }: PreloaderProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (you can adjust this based on your needs)
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoadComplete?.();
    }, 2500); // 3 seconds loading time

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#EBE7E7] z-50">
      <svg width="256" height="256" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-64">
        <g id="study">
          <rect width="64" height="64"/>
          <g id="smoke">
            <path id="smoke-1" d="M6.5 22L7.05279 20.8944C7.33431 20.3314 7.33431 19.6686 7.05279 19.1056L6.5 18L5.94721 16.8944C5.66569 16.3314 5.66569 15.6686 5.94721 15.1056L6.5 14" stroke="#797270" className="animate-smoke-1"/>
            <path id="smoke-2" d="M9 21L9.55279 19.8944C9.83431 19.3314 9.83431 18.6686 9.55279 18.1056L9 17L8.44721 15.8944C8.16569 15.3314 8.16569 14.6686 8.44721 14.1056L9 13" stroke="#797270" className="animate-smoke-2"/>
          </g>
          <g id="laptop">
            <rect id="laptop-base" x="17" y="28" width="20" height="3" fill="#F3F3F3" stroke="#453F3C" strokeWidth="2"/>
            <rect id="laptop-screen" x="18" y="17" width="18" height="11" fill="#5A524E" stroke="#453F3C" strokeWidth="2"/>
            <rect id="line-1" x="20" y="19" width="14" height="1" fill="#F78764" className="animate-writing-1"/>
            <rect id="line-2" x="20" y="21" width="14" height="1" fill="#F9AB82" className="animate-writing-2"/>
            <rect id="line-3" x="20" y="23" width="14" height="1" fill="#F78764" className="animate-writing-3"/>
            <rect id="line-4" x="20" y="25" width="14" height="1" fill="#F9AB82" className="animate-writing-4"/>
          </g>
          <g id="cup">
            <rect id="Rectangle 978" x="5" y="24" width="5" height="7" fill="#CCC4C4" stroke="#453F3C" strokeWidth="2"/>
            <path id="Ellipse 416" d="M11 28C12.1046 28 13 27.1046 13 26C13 24.8954 12.1046 24 11 24" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 996" x="6" y="25" width="3" height="1" fill="#D6D2D1"/>
          </g>
          <g id="books">
            <rect id="Rectangle 984" x="58" y="27" width="4" height="14" transform="rotate(90 58 27)" fill="#B16B4F" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 985" x="56" y="23" width="4" height="14" transform="rotate(90 56 23)" fill="#797270" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 986" x="60" y="19" width="4" height="14" transform="rotate(90 60 19)" fill="#F78764" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 993" x="47" y="20" width="12" height="1" fill="#F9AB82"/>
            <rect id="Rectangle 994" x="43" y="24" width="12" height="1" fill="#54504E"/>
            <rect id="Rectangle 995" x="45" y="28" width="12" height="1" fill="#804D39"/>
          </g>
          <g id="desk">
            <rect id="Rectangle 973" x="4" y="31" width="56" height="5" fill="#797270" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 987" x="10" y="36" width="30" height="6" fill="#797270" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 975" x="6" y="36" width="4" height="24" fill="#797270" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 974" x="40" y="36" width="18" height="24" fill="#797270" stroke="#453F3C" strokeWidth="2"/>
            <line id="Line 129" x1="40" y1="48" x2="58" y2="48" stroke="#453F3C" strokeWidth="2"/>
            <line id="Line 130" x1="22" y1="39" x2="28" y2="39" stroke="#453F3C" strokeWidth="2"/>
            <line id="Line 142" x1="46" y1="42" x2="52" y2="42" stroke="#453F3C" strokeWidth="2"/>
            <line id="Line 131" x1="46" y1="54" x2="52" y2="54" stroke="#453F3C" strokeWidth="2"/>
            <rect id="Rectangle 988" x="11" y="37" width="28" height="1" fill="#54504E"/>
            <rect id="Rectangle 992" x="5" y="32" width="54" height="1" fill="#9E9492"/>
            <rect id="Rectangle 989" x="7" y="37" width="2" height="1" fill="#54504E"/>
            <rect id="Rectangle 990" x="41" y="37" width="16" height="1" fill="#54504E"/>
            <rect id="Rectangle 991" x="41" y="49" width="16" height="1" fill="#54504E"/>
            <line id="Line 143" y1="60" x2="64" y2="60" stroke="#453F3C" strokeWidth="2"/>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Preloader; 