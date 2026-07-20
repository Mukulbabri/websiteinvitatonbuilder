import type { WeddingSettings } from '../services/database';

interface SaveTheDateCardProps {
  settings: WeddingSettings;
  venueName: string;
}

export const SaveTheDateCard = ({
  settings,
  venueName,
}: SaveTheDateCardProps) => {
  const formattedDate = new Date(settings.wedding_date || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto p-1">
      {/* Traditional Frame Template Card Container */}
      <div className="w-full aspect-[9/16] relative rounded-3xl overflow-hidden shadow-2xl border border-primary/20 bg-[#Fdf7e7]">
        {/* Background card template */}
        {settings.card_hero_bg_type === 'video' ? (
          <video
            src={settings.card_hero_bg_url || ''}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        ) : (
          <img 
            src={settings.card_hero_bg_url || '/traditional-card.png'} 
            alt="Traditional Wedding Frame" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" 
          />
        )}

        {/* Text Details absolute overlay in middle section */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center px-6 pt-[15%] pb-[20%] select-none font-poppins">
          <span className="text-[9px] md:text-[10px] tracking-[0.2em] font-semibold text-amber-950/80 uppercase">
            WE ARE CORDIALLY INVITED TO THE
          </span>
          <span className="text-[9px] md:text-[10px] tracking-[0.2em] font-semibold text-amber-950/80 uppercase mb-5 md:mb-7">
            WEDDING CEREMONY OF
          </span>

          {/* Bride */}
          <h3 className="font-candlescript text-3xl md:text-5xl text-amber-800 font-bold leading-none mb-1">
            Shreya
          </h3>
          <p className="text-[7px] md:text-[9px] font-medium text-amber-950/70 tracking-wide mb-3 md:mb-5 uppercase">
            Daughter of Mrs. Rekha Gupta & Mr. S. K. Gupta
          </p>

          {/* with connector */}
          <span className="font-candlescript text-base md:text-xl text-amber-700 italic mb-3 md:mb-5">
            with
          </span>

          {/* Groom */}
          <h3 className="font-candlescript text-3xl md:text-5xl text-amber-800 font-bold leading-none mb-1">
            Mukul Sharma
          </h3>
          <p className="text-[7px] md:text-[9px] font-medium text-amber-950/70 tracking-wide mb-5 md:mb-7 uppercase">
            Son of Mrs. Asha Sharma & Mr. R. K. Sharma
          </p>

          {/* Tiny Divider */}
          <div className="w-16 h-[1px] bg-amber-700/25 mb-4" />

          {/* Date */}
          <p className="text-[9px] md:text-[11px] font-bold text-amber-950 tracking-widest uppercase mb-1">
            {formattedDate}
          </p>

          {/* Venue */}
          <p className="text-[7px] md:text-[9px] tracking-widest text-amber-950/60 uppercase">
            AT VENUE
          </p>
          <p className="text-[9px] md:text-[11px] font-medium text-amber-950/90 uppercase max-w-[80%] leading-tight mt-0.5">
            {venueName || 'To Be Announced'}
          </p>

          {/* Footer Blessing */}
          <p className="font-candlescript text-[11px] md:text-[13px] text-amber-800 italic mt-4 md:mt-6">
            Your presence is our greatest blessing.
          </p>
        </div>
      </div>
    </div>
  );
};
