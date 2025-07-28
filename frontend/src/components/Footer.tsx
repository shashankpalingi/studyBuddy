import { useEffect } from 'react';

const Footer = () => {
  useEffect(() => {
    // Add pixel font import
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <footer className="w-full h-auto relative overflow-hidden">
      <div className="w-full overflow-hidden" style={{ maxHeight: "420px" }}>
        <img 
          src="/footer.gif" 
          alt="Footer animated background" 
          className="w-full object-cover"
          style={{ 
            objectPosition: "center 30%",
            marginTop: "-150px" 
          }}
        />
        <div 
          className="absolute" 
          style={{ 
            left: "200px", 
            top: "80px",
            textAlign: "center",
            width: "400px"
          }}
        >
          <h2 
            className="text-3xl text-white tracking-wider mb-6" 
            style={{ 
              color:"white",
              fontFamily: "'Press Start 2P', cursive",
              textShadow: "2px 2px 4px rgba(0,0,0,3.0)",
              whiteSpace: "nowrap"
            }}
          >
            GET IN TOUCH
          </h2>
          <div className="flex flex-col items-center gap-4">
            <a 
              href="https://www.linkedin.com/in/shashank-palingi-29ba8731b/" 
              style={{
                color:"lightgreen",
                fontFamily: "'Press Start 2P', cursive",
                textDecoration:"underline",
                fontSize: "15px"
              }}
            >
              linkedin
            </a> 
            <a 
              href="https://github.com/shashankpalingi" 
              style={{
                color:"lightgreen",
                fontFamily: "'Press Start 2P', cursive",
                textDecoration:"underline",
                fontSize: "15px"
              }}
            >
              github
            </a>
          </div>                    
        </div>
      </div>
    </footer>
  );
};

export default Footer; 