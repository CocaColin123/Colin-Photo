import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onEnter?: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0a0f] text-white">
      {/* 1. 最底层：视频背景 */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      >
        <source src="https://storage.googleapis.com/generativeai-downloads/images/minecraft_cave.mp4" type="video/mp4" />
      </video>

      {/* 2. 中间层：暗色遮罩和微噪点，增加层次感并确保文字可读性 */}
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 3. 上层：聚焦光点 / 呼吸感 (Bokeh / Glow Pulse) - 保留一点光影氛围 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 h-[40vh] w-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{
            background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* 4. 最上层：居中的文字和按钮 (UI Layer) */}
      <div className="relative z-20 flex h-full w-full flex-col items-center justify-center p-8">
        
        {/* 标题部分 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center text-center mb-12"
        >
          <h1 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-white/90 mb-4">
            colin（刘沛龙）个人摄影集
          </h1>
          <p className="text-sm md:text-base tracking-[0.2em] text-white/50 font-light">
            （持续更新中）
          </p>
        </motion.div>

        {/* 居中入口按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        >
          <button
            onClick={onEnter}
            className="group relative flex items-center gap-4 overflow-hidden rounded-full border border-white/30 bg-white/10 px-10 py-4 backdrop-blur-md backdrop-brightness-110 backdrop-saturate-150 transition-all duration-700 hover:border-white/50 hover:bg-white/20 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)]"
          >
            {/* 弧形高光渐变模拟玻璃折射 */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {/* 内部光感增强 */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/10 to-transparent opacity-100 transition-opacity duration-700" />

            <span className="text-base tracking-[0.2em] text-white transition-colors duration-700 pl-1">
              探索
            </span>
            <ArrowRight 
              className="h-5 w-5 text-white transition-all duration-700 group-hover:translate-x-1" 
              strokeWidth={2} 
            />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
