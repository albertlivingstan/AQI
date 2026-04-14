import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // 500ms for exit animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 1, 
          ease: "easeOut",
          scale: { type: "spring", damping: 12, stiffness: 100 }
        }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t border-r border-amber-500 opacity-60 pointer-events-none" 
            style={{ margin: '-10px', filter: 'blur(2px)' }} 
          />
          <img 
            src="/logo.png" 
            alt="SolarAQI Logo" 
            className="w-40 h-40 object-contain rounded-3xl"
            style={{ mixBlendMode: 'screen' }} 
          />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">SolarAQI</h1>
          <p className="text-slate-400 text-sm opacity-80 tracking-widest uppercase">Initializing Systems...</p>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-10 w-48 h-1 bg-slate-800 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.div 
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
