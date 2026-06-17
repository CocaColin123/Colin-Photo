import { motion } from 'motion/react';
import { Mail, ArrowRight } from 'lucide-react';
import Magnetic from '../Magnetic';
import { assetUrl } from '../../utils/asset';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  bio?: string;
  detail?: string;
  meta?: { base: string; subject: string; pace: string; format: string };
  heroImage?: string;
}

export default function AboutPage({ onNavigate, bio, detail, meta, heroImage }: AboutPageProps) {
  return (
    <motion.main
      key="about"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative z-10 min-h-screen px-6 pb-24 pt-32"
    >
      <section className="mx-auto grid max-w-[1500px] gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-end">
        <div>
          <p className="text-micro mb-5 text-white/35">ABOUT / VIEWING NOTES</p>
          <h1 className="font-serif text-[clamp(2.8rem,6.2vw,6.2rem)] leading-[1.04] text-white/90">
            关于 Colin
          </h1>
        </div>
        <div className="max-w-2xl md:ml-auto">
          <p className="font-serif text-xl md:text-2xl leading-[2] tracking-[0.06em] text-white/64 whitespace-pre-wrap">
            {bio ?? '我拍摄公园、海边、动物和路过的城市角落。相机对我来说不是记录工具，而是把世界慢下来的一种方式。'}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-[1500px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="relative overflow-hidden">
          <img
            src={assetUrl(heroImage ?? '/images/虎跑公园/10906548f727fd6353d99e82e10d6c2b.webp')}
            alt="林间水面与暗处的人影"
            className="aspect-[16/10] w-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080c]/70 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 text-[10px] tracking-[0.24em] text-white/42">
            STILL WATER / SLOW LOOKING
          </div>
        </div>

        <div className="lg:pt-10">
          <div className="border-y border-white/10 py-8">
            <p className="font-serif text-lg leading-[2.2] tracking-[0.06em] text-white/62 whitespace-pre-wrap">
              {detail ?? '我喜欢水面、树影、动物的眼神，以及那些没有人特意安排却刚好成立的画面。照片对我来说不是证明去过哪里，而是留下某一次观看的速度。'}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-6 text-white/45 md:grid-cols-4">
            <div>
              <dt className="text-[10px] tracking-[0.22em]">BASE</dt>
              <dd className="mt-2 font-serif text-white/72">{meta?.base ?? '杭州'}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em]">SUBJECT</dt>
              <dd className="mt-2 font-serif text-white/72">{meta?.subject ?? '水 / 树 / 动物'}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em]">PACE</dt>
              <dd className="mt-2 font-serif text-white/72">{meta?.pace ?? '慢'}</dd>
            </div>
            <div>
              <dt className="text-[10px] tracking-[0.22em]">FORMAT</dt>
              <dd className="mt-2 font-serif text-white/72">{meta?.format ?? '章节'}</dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-wrap gap-3">
            <Magnetic>
              <button
                type="button"
                onClick={() => onNavigate('/works')}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.16em] text-white/62 transition-colors hover:border-white/35 hover:text-white"
              >
                看作品 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Magnetic>
            <Magnetic>
              <a
                href="mailto:"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2 text-xs tracking-[0.16em] text-white/62 transition-colors hover:border-white/35 hover:text-white"
              >
                联系 <Mail className="h-3.5 w-3.5" />
              </a>
            </Magnetic>
          </div>
        </div>
      </section>
    </motion.main>
  );
}
