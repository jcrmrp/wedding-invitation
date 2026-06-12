import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from './supabaseClient';
import MusicPlayer from './components/MusicPlayer';
import FloatingNav from './components/FloatingNav';
import UpgradeModal from './components/UpgradeModal';
import EntourageDashboardEditor from './components/EntourageDashboardEditor';
import RSVPForm from './pages/RSVPForm';
import GuestPhotoWall from './pages/GuestPhotoWall';

function cropToSquare(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width || 0, img.height || 0) || 0;
      if (!size) { reject(new Error('Empty image')); return; }
      const sx = Math.max(0, (img.width - size) / 2);
      const sy = Math.max(0, (img.height - size) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Crop failed')), 'image/png', 0.92);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

const myStory = `They met at the wrong time in the simplest way possible.
Not through a grand gesture.

Not through destiny written in the stars.

Not through some perfect movie moment.
Just two exhausted people trying to survive life.
She first noticed him on a rainy afternoon. The kind of rain that made the entire city look gray and tired. He was standing under the roof outside a small convenience store, holding a coffee in one hand and helping an old woman carry her groceries with the other. His sleeves were rolled up, his shoes soaked from the rain, and yet he still smiled like the weather had no power over him.
She remembered thinking,
“That smile feels safe.”
He noticed her too.
A girl clutching her umbrella with both hands, staring at the rain like she carried the weight of the world on her shoulders. She looked beautiful, but not in the loud kind of way. She looked beautiful the way sunsets did — quiet, soft, and impossible to forget once you had seen them.
They didn’t speak that day.
But life has a strange way of circling people back to each other.
Weeks later, they met again at a friend’s birthday dinner. This time, they talked. At first it was awkward — little jokes, polite smiles, conversations about work, traffic, favorite food. Nothing extraordinary.
And yet somehow, when the night ended, neither of them wanted to leave.
So they kept talking.
Days became weeks.

Weeks became midnight calls.

Midnight calls became morning routines.
She became the first person he wanted to tell everything to.

He became the place she ran to whenever life hurt too much.
And slowly, without realizing it, they built a home inside each other.
He learned how she liked her coffee.

She learned that he pretended to be strong even when he was breaking.

He memorized the sound of her laugh.

She memorized the silence in his eyes whenever something bothered him.
They fell in love not in one dramatic moment—

but in thousands of tiny ones.
In the way he always walked closest to the road.

In the way she fixed his collar before important meetings.

In the random “Did you eat already?” messages.

In the long drives with no destination.

In the comfortable silence where neither of them needed to speak.
But love stories are never perfect.
There were nights filled with arguments.

Moments of doubt.

Misunderstandings that left tears on both sides.
There were times life pulled them apart — careers, responsibilities, fears, expectations from other people. Sometimes they wondered if love alone was enough.
But every single time they tried to walk away, they found themselves returning to each other.
Because real love is not about never breaking.
It’s about choosing each other even after the breaking.
Years passed.
Their love matured.
The butterflies became peace.

The excitement became certainty.

The temporary became permanent.
One evening, they sat together watching the sunset from the hood of his car. The sky was painted in orange and gold, and the wind carried the quiet comfort of being with the right person.
She leaned her head on his shoulder and whispered,

“Do you think we’ll last forever?”
He looked at her for a long moment before smiling softly.
“I think forever already started a long time ago.”
And on that same night, under a sky full of stars and trembling hands, he asked her the question he had carried in his heart for years.
“Will you marry me?”
She cried before she answered.
Not because she was surprised.

But because deep down, she had been waiting for this moment since the day she saw him smiling in the rain.
“Yes,” she whispered.

“Yes. Always yes.”
Their wedding day arrived like a dream.
The church doors opened, and for a moment, everything stood still.
He looked at her walking down the aisle in white, and suddenly every heartbreak he had ever experienced made sense. Every failure. Every lonely night. Every wrong turn in life.
Because all of it had led him to her.
And when she reached him, he held her hands tightly like he was afraid the universe might suddenly take her away.
But it wouldn’t.
Not anymore.
The vows were simple.
No poetic promises.

No perfect speeches.
Just truth.
“I will choose you on easy days and difficult ones.”

“I will love you when life is kind and when it is cruel.”

“I will become your family, your safest place, and your greatest home.”
And when they kissed as husband and wife, the entire room erupted in applause and tears.
Not because two people got married.
But because everyone witnessing them could see it clearly—
this was the kind of love people spend their entire lives searching for.
The kind that stays.

The kind that heals.

The kind that grows old holding hands.
And years later, when their hair turned gray and their steps became slower, people would still catch them smiling at each other across crowded rooms like they had just fallen in love yesterday.
Because some love stories do not end after the wedding.
That is only where the forever truly begins.`;

type TemplateDefinition = {
  id: string;
  name: string;
  heroImage: string;
  heroSubtitle: string;
  theme: {
    background: string;
    section: string;
    surface: string;
    text: string;
    heading: string;
    accent: string;
    accentText: string;
    muted: string;
    border: string;
    buttonBg: string;
    buttonText: string;
    cardBg: string;
    giftBg: string;
    navBg: string;
    navText: string;
    navBorder: string;
  };
  font: string;
};

const templates: TemplateDefinition[] = [
  {
    id: 'classic-ivory',
    name: 'Classic Ivory',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'A warm, timeless invitation with soft cream tones and elegant details.',
    theme: {
      background: '#faf4eb',
      section: '#fff8f0',
      surface: '#fffdf9',
      text: '#4a3f35',
      heading: '#7c5a3a',
      accent: '#b07f56',
      accentText: '#ffffff',
      muted: '#7b6a5d',
      border: '#e5d9ce',
      buttonBg: '#b07f56',
      buttonText: '#ffffff',
      cardBg: '#fff8f2',
      giftBg: '#f7efe7',
      navBg: 'rgba(255,255,255,0.9)',
      navText: '#4a3f35',
      navBorder: '#d7c8b9',
    },
    font: '"Playfair Display", serif',
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Floral romance with blush petals, verdant greens, and graceful accents.',
    theme: {
      background: '#f9ece9',
      section: '#fff4f2',
      surface: '#fff2f1',
      text: '#5b4035',
      heading: '#8b4e47',
      accent: '#d98c6a',
      accentText: '#ffffff',
      muted: '#8d7067',
      border: '#e6cec8',
      buttonBg: '#d98c6a',
      buttonText: '#ffffff',
      cardBg: '#fff5f2',
      giftBg: '#fde8e4',
      navBg: 'rgba(255,248,247,0.95)',
      navText: '#7d4f4a',
      navBorder: '#e5c7c2',
    },
    font: '"Georgia", serif',
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    heroImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'A clean, stylish invitation with crisp lines and sophisticated contrast.',
    theme: {
      background: '#f3f5f8',
      section: '#ffffff',
      surface: '#f8fafc',
      text: '#1f2937',
      heading: '#111827',
      accent: '#0f4c81',
      accentText: '#ffffff',
      muted: '#6b7280',
      border: '#d1d5db',
      buttonBg: '#0f4c81',
      buttonText: '#ffffff',
      cardBg: '#ffffff',
      giftBg: '#eff4fb',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#111827',
      navBorder: '#d1d5db',
    },
    font: 'system-ui, sans-serif',
  },
  {
    id: 'desert-dunes',
    name: 'Desert Dunes',
    heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Warm desert hues and soft textures for a desert-inspired celebration.',
    theme: {
      background: '#f4ece4',
      section: '#f8f1ea',
      surface: '#fff7f1',
      text: '#5a453c',
      heading: '#7c604e',
      accent: '#c5855e',
      accentText: '#ffffff',
      muted: '#8b7265',
      border: '#e2d1c7',
      buttonBg: '#c5855e',
      buttonText: '#ffffff',
      cardBg: '#fff0e8',
      giftBg: '#f9e8dc',
      navBg: 'rgba(255,250,247,0.9)',
      navText: '#5a453c',
      navBorder: '#dac6bb',
    },
    font: '"Cormorant Garamond", serif',
  },
  {
    id: 'moonlit-lace',
    name: 'Moonlit Lace',
    heroImage: 'https://images.unsplash.com/photo-1522233657134-1d1c5bb5bbc6?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Elegant moonlit tones with lace-inspired details and glowing accents.',
    theme: {
      background: '#f9f6f3',
      section: '#ffffff',
      surface: '#f7f3f0',
      text: '#3f3c42',
      heading: '#5a4f57',
      accent: '#7f6b9e',
      accentText: '#ffffff',
      muted: '#81787e',
      border: '#ddd7d6',
      buttonBg: '#7f6b9e',
      buttonText: '#ffffff',
      cardBg: '#fbf7f4',
      giftBg: '#f5eff0',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#4f4951',
      navBorder: '#dbd3d5',
    },
    font: '"Lora", serif',
  },
  {
    id: 'botanical-green',
    name: 'Botanical Green',
    heroImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Fresh botanical greens and organic textures for natural charm.',
    theme: {
      background: '#f1f5f1',
      section: '#f6faf7',
      surface: '#ffffff',
      text: '#334d3b',
      heading: '#2d5f42',
      accent: '#4c7a52',
      accentText: '#ffffff',
      muted: '#697b6e',
      border: '#d9e1da',
      buttonBg: '#4c7a52',
      buttonText: '#ffffff',
      cardBg: '#f5faf5',
      giftBg: '#eaf2ea',
      navBg: 'rgba(255,255,255,0.88)',
      navText: '#334d3b',
      navBorder: '#cdd9ce',
    },
    font: '"Merriweather", serif',
  },
  {
    id: 'coastal-breeze',
    name: 'Coastal Breeze',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Soft seaside blues with airy textures and calming coastal energy.',
    theme: {
      background: '#f3f7f9',
      section: '#ffffff',
      surface: '#f8fbfd',
      text: '#274a5b',
      heading: '#1f3d4f',
      accent: '#5fa0c7',
      accentText: '#ffffff',
      muted: '#6d8b9d',
      border: '#dce6eb',
      buttonBg: '#5fa0c7',
      buttonText: '#ffffff',
      cardBg: '#eef6fb',
      giftBg: '#e5f2fa',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#274a5b',
      navBorder: '#d3e1e9',
    },
    font: 'system-ui, sans-serif',
  },
  {
    id: 'velvet-night',
    name: 'Velvet Night',
    heroImage: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Deep sapphire tones and luxurious midnight style for intimate evenings.',
    theme: {
      background: '#f3f3f8',
      section: '#fbfbff',
      surface: '#f6f5fb',
      text: '#1f2433',
      heading: '#2d3450',
      accent: '#2d4a78',
      accentText: '#ffffff',
      muted: '#6b7280',
      border: '#d8d9e4',
      buttonBg: '#2d4a78',
      buttonText: '#ffffff',
      cardBg: '#f5f6fb',
      giftBg: '#eef1f7',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#2d3450',
      navBorder: '#cfd3e0',
    },
    font: '"Spectral", serif',
  },
  {
    id: 'paper-blossom',
    name: 'Paper Blossom',
    heroImage: 'https://images.unsplash.com/photo-1516715094484-1a9cf1b6e8b4?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Soft paper texture with delicate blossom tones for a romantic touch.',
    theme: {
      background: '#fbf2ef',
      section: '#fff7f4',
      surface: '#ffffff',
      text: '#5c4d46',
      heading: '#7d5a4d',
      accent: '#c1886f',
      accentText: '#ffffff',
      muted: '#8b7a72',
      border: '#e8d8cf',
      buttonBg: '#c1886f',
      buttonText: '#ffffff',
      cardBg: '#fff6f1',
      giftBg: '#f7ece8',
      navBg: 'rgba(255,255,255,0.95)',
      navText: '#5c4d46',
      navBorder: '#dfc9c0',
    },
    font: '"Times New Roman", serif',
  },
  {
    id: 'golden-glow',
    name: 'Golden Glow',
    heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Sunlit gold highlights with warm neutrals and luminous accents.',
    theme: {
      background: '#f7f0e8',
      section: '#fff8f1',
      surface: '#fff9f4',
      text: '#4d3a2e',
      heading: '#74593f',
      accent: '#c68a4f',
      accentText: '#ffffff',
      muted: '#897467',
      border: '#e7d6c8',
      buttonBg: '#c68a4f',
      buttonText: '#ffffff',
      cardBg: '#fff4ec',
      giftBg: '#f7e8dc',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#4d3a2e',
      navBorder: '#dcc7b6',
    },
    font: '"Libre Baskerville", serif',
  },
  {
    id: 'vintage-bloom',
    name: 'Vintage Bloom',
    heroImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Brushstrokes of vintage florals and nostalgic soft hues.',
    theme: {
      background: '#f4ece8',
      section: '#fff7f5',
      surface: '#fff8f6',
      text: '#58483f',
      heading: '#7a5f58',
      accent: '#a67b6f',
      accentText: '#ffffff',
      muted: '#8a7b76',
      border: '#e4d3ce',
      buttonBg: '#a67b6f',
      buttonText: '#ffffff',
      cardBg: '#fff6f2',
      giftBg: '#f7e9e4',
      navBg: 'rgba(255,255,255,0.93)',
      navText: '#58483f',
      navBorder: '#dcc9c4',
    },
    font: '"Palatino Linotype", serif',
  },
  {
    id: 'winter-pearl',
    name: 'Winter Pearl',
    heroImage: 'https://images.unsplash.com/photo-1517824806700-16d8d4b04f20?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Cool pearl neutrals and frosty blue accents for a serene winter wedding.',
    theme: {
      background: '#f4f6f7',
      section: '#ffffff',
      surface: '#f7f8fa',
      text: '#2f3b43',
      heading: '#2b4250',
      accent: '#5f7f95',
      accentText: '#ffffff',
      muted: '#6f7f8c',
      border: '#d9e3e8',
      buttonBg: '#5f7f95',
      buttonText: '#ffffff',
      cardBg: '#f3f7fb',
      giftBg: '#e9f1f7',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#2f3b43',
      navBorder: '#d8e1e8',
    },
    font: '"Avenir", sans-serif',
  },
  {
    id: 'meadow-light',
    name: 'Meadow Light',
    heroImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Bright meadow greens and soft summer light for an outdoor celebration.',
    theme: {
      background: '#eef7ef',
      section: '#ffffff',
      surface: '#f7fbf6',
      text: '#3f513f',
      heading: '#33513a',
      accent: '#6d9b7b',
      accentText: '#ffffff',
      muted: '#7e8f7f',
      border: '#d8e2d9',
      buttonBg: '#6d9b7b',
      buttonText: '#ffffff',
      cardBg: '#f4faf3',
      giftBg: '#e6f0e4',
      navBg: 'rgba(255,255,255,0.95)',
      navText: '#3f513f',
      navBorder: '#d7e2d8',
    },
    font: '"Georgia", serif',
  },
  {
    id: 'blush-charm',
    name: 'Blush Charm',
    heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Delicate blush pink and warm ivory for a charming romantic feel.',
    theme: {
      background: '#fbf1ef',
      section: '#fff7f5',
      surface: '#fff6f4',
      text: '#5a4441',
      heading: '#7a5754',
      accent: '#d18d82',
      accentText: '#ffffff',
      muted: '#907a76',
      border: '#e8d6d3',
      buttonBg: '#d18d82',
      buttonText: '#ffffff',
      cardBg: '#fff4f2',
      giftBg: '#f8e7e5',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#5a4441',
      navBorder: '#dfc8c5',
    },
    font: '"Times New Roman", serif',
  },
  {
    id: 'twilight-romance',
    name: 'Twilight Romance',
    heroImage: 'https://images.unsplash.com/photo-1477847616638-283b22d6a9da?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Soft evening skies and romantic candlelight tones with luxurious depth.',
    theme: {
      background: '#f4f1f4',
      section: '#ffffff',
      surface: '#f8f6f8',
      text: '#33303b',
      heading: '#4a4150',
      accent: '#7a5b7d',
      accentText: '#ffffff',
      muted: '#7c7380',
      border: '#d9d3da',
      buttonBg: '#7a5b7d',
      buttonText: '#ffffff',
      cardBg: '#f7f4f7',
      giftBg: '#ede8ef',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#3c3644',
      navBorder: '#dad3db',
    },
    font: '"Playfair Display", serif',
  },
  {
    id: 'garden-party',
    name: 'Garden Party',
    heroImage: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Playful garden charm with pastel shades and joyful, airy style.',
    theme: {
      background: '#fbf7f2',
      section: '#ffffff',
      surface: '#fbfaf7',
      text: '#4c4f3a',
      heading: '#5e6b4d',
      accent: '#a3b063',
      accentText: '#ffffff',
      muted: '#7a8470',
      border: '#dde0d6',
      buttonBg: '#a3b063',
      buttonText: '#ffffff',
      cardBg: '#f8f8f4',
      giftBg: '#edf2e8',
      navBg: 'rgba(255,255,255,0.96)',
      navText: '#4c4f3a',
      navBorder: '#d7d9cf',
    },
    font: '"Segoe UI", sans-serif',
  },
  {
    id: 'sage-stone',
    name: 'Sage & Stone',
    heroImage: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Subtle sage tones paired with stone-gray elegance for modern refinement.',
    theme: {
      background: '#f1f3f1',
      section: '#ffffff',
      surface: '#f6f8f5',
      text: '#33403b',
      heading: '#41524c',
      accent: '#7a8b7f',
      accentText: '#ffffff',
      muted: '#737c78',
      border: '#d8ded7',
      buttonBg: '#7a8b7f',
      buttonText: '#ffffff',
      cardBg: '#f3f6f2',
      giftBg: '#e9efe9',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#33403b',
      navBorder: '#d5dbd5',
    },
    font: '"Roboto", sans-serif',
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    heroImage: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Bold geometric lines, rich contrast, and polished metallic accents.',
    theme: {
      background: '#f5f3f1',
      section: '#ffffff',
      surface: '#f8f6f4',
      text: '#262626',
      heading: '#2c2c2c',
      accent: '#ad8a4a',
      accentText: '#ffffff',
      muted: '#7b7063',
      border: '#d7d1c8',
      buttonBg: '#2c2c2c',
      buttonText: '#ffffff',
      cardBg: '#f7f5f3',
      giftBg: '#f1ede7',
      navBg: 'rgba(255,255,255,0.92)',
      navText: '#262626',
      navBorder: '#d2ccc5',
    },
    font: '"Cinzel", serif',
  },
  {
    id: 'rustic-barn',
    name: 'Rustic Barn',
    heroImage: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Earthy wood textures and warm amber tones for a cozy rustic feel.',
    theme: {
      background: '#f5efe6',
      section: '#fbf6f0',
      surface: '#f9f4ee',
      text: '#5e4734',
      heading: '#7a5f47',
      accent: '#a56f43',
      accentText: '#ffffff',
      muted: '#8a7a6c',
      border: '#ddc9be',
      buttonBg: '#a56f43',
      buttonText: '#ffffff',
      cardBg: '#f5eee6',
      giftBg: '#f0e3d7',
      navBg: 'rgba(255,255,255,0.96)',
      navText: '#5e4734',
      navBorder: '#dcc5b6',
    },
    font: '"Palatino", serif',
  },
  {
    id: 'starlit-waltz',
    name: 'Starlit Waltz',
    heroImage: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Soft twilight blues and shimmering accents for a dreamy evening event.',
    theme: {
      background: '#f3f4f7',
      section: '#ffffff',
      surface: '#f7f8fb',
      text: '#2f3140',
      heading: '#3a3f57',
      accent: '#6373b2',
      accentText: '#ffffff',
      muted: '#7a81a0',
      border: '#d7d9e4',
      buttonBg: '#6373b2',
      buttonText: '#ffffff',
      cardBg: '#f5f7fb',
      giftBg: '#e9edf8',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#2f3140',
      navBorder: '#d3d6e0',
    },
    font: '"Fira Sans", sans-serif',
  },
  {
    id: 'celestial-vow',
    name: 'Celestial Vow',
    heroImage: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
    heroSubtitle: 'Light celestial hues with silver details and graceful cosmic elegance.',
    theme: {
      background: '#f5f7fa',
      section: '#ffffff',
      surface: '#f8fafc',
      text: '#2e3a4b',
      heading: '#3b4a61',
      accent: '#5f7caf',
      accentText: '#ffffff',
      muted: '#73849d',
      border: '#d9e2ec',
      buttonBg: '#5f7caf',
      buttonText: '#ffffff',
      cardBg: '#eef3f8',
      giftBg: '#e5ebf4',
      navBg: 'rgba(255,255,255,0.94)',
      navText: '#2e3a4b',
      navBorder: '#d5dee8',
    },
    font: '"Montserrat", sans-serif',
  },
];

// --- Components ---

function Countdown({
  targetDate, accent, background, text, border, isPreview = false,
}: {
  targetDate: string; accent: string; background: string;
  text: string; border: string; isPreview?: boolean;
}) {
  // Resolve the effective target — for preview, keep rolling the year forward
  // so it's always at least 1 month away
  const resolveTarget = (): Date => {
    if (!targetDate) return new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    let d = new Date(targetDate);
    if (isPreview) {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      // Keep bumping the year until the date is at least 1 month away
      while (d <= oneMonthFromNow) {
        d = new Date(d.getFullYear() + 1, d.getMonth(), d.getDate(),
          d.getHours(), d.getMinutes(), d.getSeconds());
      }
    }
    return d;
  };

  type TimeState = {
    years: number; days: number; hours: number; minutes: number; seconds: number;
    countingUp: boolean;
  };

  const calc = (): TimeState => {
    const target = resolveTarget();
    const now = Date.now();
    const diff = +target - now;
    const countingUp = diff <= 0;
    const abs = Math.abs(diff);

    const totalSeconds = Math.floor(abs / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;

    return { years, days, hours, minutes, seconds, countingUp };
  };

  const [time, setTime] = useState<TimeState>(calc);

  useEffect(() => {
    const timer = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(timer);
  }, [targetDate, isPreview]);

  const units = time.countingUp
    ? [
        ...(time.years > 0 ? [{ val: time.years, label: time.years === 1 ? 'YEAR' : 'YEARS' }] : []),
        { val: time.days,    label: 'DAYS'  },
        { val: time.hours,   label: 'HRS'   },
        { val: time.minutes, label: 'MINS'  },
        { val: time.seconds, label: 'SECS'  },
      ]
    : [
        { val: time.days + time.years * 365, label: 'DAYS'  },
        { val: time.hours,                   label: 'HRS'   },
        { val: time.minutes,                 label: 'MINS'  },
        { val: time.seconds,                 label: 'SECS'  },
      ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '8px', margin: '15px 0',
    }}>
      {time.countingUp && (
        <div style={{
          fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: accent, opacity: 0.9, marginBottom: '2px',
        }}>
          🎉 Happily Married
        </div>
      )}
      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        fontSize: '1.2rem', background, color: text,
        padding: '16px 20px', borderRadius: '24px',
        border: `1px solid ${border}`, alignItems: 'center',
        maxWidth: '760px',
      }}>
        {units.map(({ val, label }) => (
          <div key={label} style={{ textAlign: 'center', minWidth: '42px' }}>
            <div style={{ fontWeight: 700 }}>{String(val).padStart(2, '0')}</div>
            <div style={{ fontSize: '0.62rem', color: accent, letterSpacing: '0.1em', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>
      {time.countingUp && (
        <div style={{
          fontSize: '0.68rem', letterSpacing: '0.14em', color: text,
          opacity: 0.7, textTransform: 'uppercase',
        }}>
          and counting ♡
        </div>
      )}
    </div>
  );
}

function TemplatePicker({ templates, selectedId, onSelect, floating }: { templates: TemplateDefinition[]; selectedId: string; onSelect: (id: string) => void; floating?: boolean; }) {
  const [collapsed, setCollapsed] = useState(true);
  const wrapperStyle: CSSProperties = floating
    ? {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: collapsed ? 'auto' : 'min(320px, 96vw)',
        maxHeight: collapsed ? 'auto' : 'calc(100vh - 44px)',
        overflowY: collapsed ? 'visible' : 'auto',
        padding: collapsed ? '8px 10px' : '16px',
        background: 'rgba(255,255,255,0.94)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
        borderRadius: '18px',
        zIndex: 1002,
        backdropFilter: 'blur(10px)',
        transition: 'width 0.2s ease, max-height 0.2s ease, padding 0.2s ease',
      }
    : { padding: '40px 20px', maxWidth: '1120px', margin: '0 auto 40px' };

  return (
    <div style={wrapperStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: collapsed ? 0 : '12px' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', color: '#2f3140', fontFamily: 'inherit' }}>Templates</h2>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          style={{
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: '5px 6px',
            borderRadius: '10px',
            color: '#2f3140',
            fontWeight: 700,
            fontSize: '1rem',
            lineHeight: 1,
            minWidth: '34px',
            minHeight: '34px',
          }}
          aria-label={collapsed ? 'Open templates panel' : 'Close templates panel'}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              style={{
                minHeight: '90px',
                padding: '12px',
                borderRadius: '14px',
                border: `2px solid ${selectedId === template.id ? template.theme.accent : template.theme.border}`,
                background: selectedId === template.id ? template.theme.accent : template.theme.surface,
                color: selectedId === template.id ? template.theme.accentText : template.theme.text,
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
                textAlign: 'left',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(event) => { (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(event) => { (event.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontWeight: 700, marginBottom: '6px', fontFamily: 'inherit', fontSize: '0.94rem' }}>{template.name}</div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.3', color: selectedId === template.id ? template.theme.accentText : template.theme.muted }}>{template.heroSubtitle}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StorySection({ 
  title, 
  content, 
  style, 
  textColor, 
  headingColor, 
  isEditing,
  storyImages,
  onStoryImageChange
}: { 
  title: string; 
  content: string; 
  style?: CSSProperties; 
  textColor: string; 
  headingColor: string;
  isEditing?: boolean;
  storyImages?: string[];
  onStoryImageChange?: (index: number, url: string) => void;
}) {
  const segments = content.split(/\n\n+/).filter(s => s.trim() !== "");
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        nextPage();
      } else if (e.key === 'ArrowLeft') {
        prevPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, segments.length]);

  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = () => {
    if (!isDraggingRef.current) return;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    
    const diffX = touchStartRef.current.x - e.clientX;
    const diffY = touchStartRef.current.y - e.clientY;
    
    // Only react if horizontal swipe is bigger than vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        // Swipe left - go to next page
        nextPage();
      } else if (diffX < -50) {
        // Swipe right - go to previous page
        prevPage();
      }
    }
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const diffX = touchStartRef.current.x - touchEnd.x;
    const diffY = touchStartRef.current.y - touchEnd.y;
    
    // Only react if horizontal swipe is bigger than vertical swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        // Swipe left - go to next page
        nextPage();
      } else if (diffX < -50) {
        // Swipe right - go to previous page
        prevPage();
      }
    }
  };
  
  // Placeholder images using picsum
  const placeholderImages = [
    "https://picsum.photos/seed/1/800/600",
    "https://picsum.photos/seed/2/800/600",
    "https://picsum.photos/seed/3/800/600",
    "https://picsum.photos/seed/4/800/600",
    "https://picsum.photos/seed/5/800/600",
    "https://picsum.photos/seed/6/800/600",
    "https://picsum.photos/seed/7/800/600",
    "https://picsum.photos/seed/8/800/600",
    "https://picsum.photos/seed/9/800/600",
    "https://picsum.photos/seed/10/800/600",
    "https://picsum.photos/seed/11/800/600",
    "https://picsum.photos/seed/12/800/600"
  ];
  


  const nextPage = () => {
    if (currentPage < segments.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      viewport={{ once: true }}
      style={{ 
        padding: '60px 20px', 
        maxWidth: '1100px', 
        margin: '60px auto',
        ...style 
      }}
    >
      {/* Book Title */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        paddingBottom: '30px',
        borderBottom: '2px solid #d4c4b0'
      }}>
        <h2 style={{ 
          fontFamily: 'Georgia, serif',
          fontSize: '3rem',
          fontWeight: '400',
          color: headingColor,
          marginBottom: '10px',
          fontStyle: 'italic'
        }}>
          {title}
        </h2>
        <div style={{ fontSize: '1.2rem', color: '#d4c4b0', letterSpacing: '0.2em' }}>
          ◆ ─────── ✦ ─────── ◆
        </div>
      </div>
      
      {/* Book Container */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: '2000px',
          position: 'relative',
          minHeight: '500px',
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          overflow: 'hidden',
          overflowY: 'auto',
          touchAction: 'pan-y pinch-zoom', // Allow vertical scroll but capture horizontal swipes
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto'
        }}>
        {/* Navigation Buttons */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={prevPage}
          disabled={currentPage === 0}
          style={{
            position: 'absolute',
            left: '-60px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            background: currentPage === 0 ? 'transparent' : 'rgba(255,255,255,0.9)',
            border: currentPage === 0 ? 'none' : `2px solid ${headingColor}`,
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '1.5rem',
            cursor: currentPage === 0 ? 'default' : 'pointer',
            color: currentPage === 0 ? '#ccc' : headingColor,
            boxShadow: currentPage === 0 ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          ←
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={nextPage}
          disabled={currentPage === segments.length - 1}
          style={{
            position: 'absolute',
            right: '-60px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            background: currentPage === segments.length - 1 ? 'transparent' : 'rgba(255,255,255,0.9)',
            border: currentPage === segments.length - 1 ? 'none' : `2px solid ${headingColor}`,
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '1.5rem',
            cursor: currentPage === segments.length - 1 ? 'default' : 'pointer',
            color: currentPage === segments.length - 1 ? '#ccc' : headingColor,
            boxShadow: currentPage === segments.length - 1 ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          →
        </motion.button>

        {/* Book Pages */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ rotateY: -90, opacity: 0, x: -100 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 90, opacity: 0, x: 100 }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 50, damping: 15 }}
            style={{
              background: 'linear-gradient(135deg, #fdfbf7 0%, #ffffff 50%, #fdfbf7 100%)',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2), inset 0 0 100px rgba(0,0,0,0.03)',
              border: '1px solid #e8e0d5',
              minHeight: '500px',
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              overflowX: 'hidden',
              overflowY: 'auto'
            }}
          >
            {/* Left or Right Content */}
            {currentPage % 2 === 0 ? (
              <>
                {/* Image on Left */}
                <div style={{
                  background: '#f5f0eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px',
                  borderRight: '1px solid #e8e0d5',
                  overflow: 'auto'
                }}>
                  <UploadableImage
                    src={storyImages && storyImages[currentPage] ? storyImages[currentPage] : placeholderImages[currentPage % placeholderImages.length]}
                    isEditing={isEditing}
                    onUpload={(url) => onStoryImageChange?.(currentPage, url)}
                    style={{ 
                      width: '100%', 
                      maxHeight: '400px', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
                {/* Text on Right */}
                <div style={{ 
                  padding: '40px 50px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  background: 'linear-gradient(to right, #fffef9 0%, #ffffff 100%)',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: headingColor,
                    opacity: 0.6,
                    marginBottom: '20px'
                  }}>
                    Page {currentPage + 1} of {segments.length}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.15rem',
                    lineHeight: '1.9',
                    color: textColor,
                    textAlign: 'justify'
                  }}>
                    {segments[currentPage]}
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Text on Left */}
                <div style={{ 
                  padding: '40px 50px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  background: 'linear-gradient(to left, #fffef9 0%, #ffffff 100%)',
                  borderRight: '1px solid #e8e0d5',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: headingColor,
                    opacity: 0.6,
                    marginBottom: '20px'
                  }}>
                    Page {currentPage + 1} of {segments.length}
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontFamily: 'Georgia, serif',
                    fontSize: '1.15rem',
                    lineHeight: '1.9',
                    color: textColor,
                    textAlign: 'justify'
                  }}>
                    {segments[currentPage]}
                  </p>
                </div>
                {/* Image on Right */}
                <div style={{
                  background: '#f5f0eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px',
                  overflow: 'auto'
                }}>
                  <UploadableImage
                    src={storyImages && storyImages[currentPage] ? storyImages[currentPage] : placeholderImages[currentPage % placeholderImages.length]}
                    isEditing={isEditing}
                    onUpload={(url) => onStoryImageChange?.(currentPage, url)}
                    style={{ 
                      width: '100%', 
                      maxHeight: '400px', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                    }}
                  />
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Page Indicator */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        paddingTop: '30px',
        borderTop: '2px solid #d4c4b0'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {segments.map((_, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentPage(index)}
              style={{
                width: index === currentPage ? '14px' : '10px',
                height: index === currentPage ? '14px' : '10px',
                borderRadius: '50%',
                background: index === currentPage ? headingColor : '#d4c4b0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        <p style={{ 
          marginTop: '20px', 
          color: headingColor,
          fontSize: '0.9rem',
          opacity: 0.7 
        }}>
          Click the arrows or dots to turn the pages ✦
        </p>
      </div>
    </motion.div>
  );
}

// UploadableImage — wraps any image with a click-to-upload overlay in edit mode
function UploadableImage({
  src, isEditing, onUpload, style, motionProps, className, onDelete, showDelete = false,
}: {
  src: string;
  isEditing?: boolean;
  onUpload?: (url: string) => void;
  style?: React.CSSProperties;
  motionProps?: any;
  className?: string;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpload?.(url);
    e.target.value = '';
  };

  if (!isEditing) {
    return (
      <motion.img
        src={src}
        className={className}
        style={style}
        draggable={false}
        {...(motionProps || {})}
      />
    );
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', width: style?.width, flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.img
        src={src}
        className={className}
        style={{ ...style, display: 'block', transition: 'filter 0.2s', filter: hovered ? 'brightness(0.55)' : 'none' }}
        draggable={false}
        {...(motionProps || {})}
      />
      {isEditing && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            onMouseEnter={(e) => { e.stopPropagation(); setHovered(false); }}
            onMouseLeave={(e) => { e.stopPropagation(); }}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.9)', color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: '1rem', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
            }}
            title="Delete photo"
          >
            ✕
          </button>
        </div>
      )}
      {/* Overlay button */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '6px', cursor: 'pointer', borderRadius: style?.borderRadius,
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
        }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: '50%',
          width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          📷
        </div>
        <span style={{
          color: '#fff', fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>
          Change Photo
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </div>
  );
}

function PhotoGallery({ images, theme, isEditing, plan, onImageChange, onAddImage, onUpgradeClick, onDeleteImage }: { 
  images: string[]; 
  theme: TemplateDefinition['theme'];
  isEditing?: boolean;
  plan?: string;
  onImageChange?: (index: number, url: string) => void;
  onAddImage?: (url: string) => void;
  onUpgradeClick?: () => void;
  onDeleteImage?: (index: number) => void;
}) {
  const [addImageInput, setAddImageInput] = useState<HTMLInputElement | null>(null);

  // Get current limit
  const getGalleryLimit = (p: string) => {
    if (p.includes('keepsake')) {
      if (p.includes('200')) return 200;
      if (p.includes('100')) return 100;
      if (p.includes('50')) return 50;
      return 20;
    }
    if (p === 'storyteller') return 5;
    return 1;
  };

  const limit = getGalleryLimit(plan || 'essential');
  const isAtLimit = images.length >= limit;

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddImage) {
      onAddImage(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: theme.section, borderRadius: '20px' }}>
      <h2 style={{ color: theme.heading, marginBottom: '10px' }}>Our Gallery</h2>
      {isEditing && (
        <p style={{ color: theme.muted, marginBottom: '24px', fontSize: '0.9rem' }}>
          Gallery: {images.length}/{limit} photos
        </p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        {images.map((img, index) => (
          <UploadableImage
            key={index}
            src={img}
            isEditing={isEditing}
            onUpload={(url) => onImageChange?.(index, url)}
            onDelete={() => onDeleteImage?.(index)}
            showDelete={true}
            style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: `1px solid ${theme.border}` }}
            motionProps={{ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 }, transition: { duration: 0.5, delay: index * 0.1 }, viewport: { once: true } }}
          />
        ))}

        {isEditing && !isAtLimit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => addImageInput?.click()}
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '15px',
              border: `2px dashed ${theme.border}`,
              backgroundColor: theme.surface,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            whileHover={{ scale: 1.02, borderColor: theme.accent }}
            whileTap={{ scale: 0.97 }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
              ➕
            </div>
            <p style={{ color: theme.muted, fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
              Add Photo
            </p>
            <input
              ref={(el) => setAddImageInput(el)}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAddImageFile}
            />
          </motion.div>
        )}
      </div>

      {isEditing && isAtLimit && (
        <div style={{ 
          textAlign: 'center', 
          padding: '24px', 
          background: theme.surface, 
          borderRadius: '16px', 
          border: `1px dashed ${theme.border}` 
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
            📸
          </div>
          <p style={{ color: theme.heading, fontSize: '1.05rem', margin: '0 0 12px', fontWeight: 600 }}>
            You've reached your photo limit!
          </p>
          <p style={{ color: theme.muted, fontSize: '0.88rem', margin: '0 0 18px', lineHeight: 1.6 }}>
            Upgrade to add more photos to your gallery.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgradeClick}
            style={{ 
              padding: '12px 32px', 
              borderRadius: '24px', 
              border: 'none', 
              background: `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accent}dd 100%)`, 
              color: theme.accentText, 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              letterSpacing: '0.08em', 
              cursor: 'pointer', 
              fontFamily: 'inherit',
              boxShadow: `0 8px 24px ${theme.accent}33`
            }}
          >
            ✨ Upgrade Plan
          </motion.button>
        </div>
      )}
    </div>
  );
}

function GiftSection({ 
  theme, 
  gcashNumber = "09171234567",
  customQrImage = "",
  isEditing = false,
  onGcashNumberChange,
  onQrImageChange,
  onQrFileUpload,
}: { 
  theme: TemplateDefinition['theme'];
  gcashNumber?: string;
  customQrImage?: string;
  isEditing?: boolean;
  onGcashNumberChange?: (number: string) => void;
  onQrImageChange?: (url: string) => void;
onQrFileUpload?: (file: File) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [qrHovered, setQrHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);

  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, size: 100 });
  const [dragging, setDragging] = useState<{ type: 'move' | 'resize'; startX: number; startY: number } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gcashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openCropModal = (file: File) => {
    const url = URL.createObjectURL(file);
    setCropImage(url);
    setCropRect({ x: 0, y: 0, size: 100 });
  };

  const applyCrop = async (): Promise<File | null> => {
    if (!cropImage) return null;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const container = cropContainerRef.current;
        if (!container) { reject(new Error('Missing crop container')); return; }

        const rect = container.getBoundingClientRect();
        const scaleX = img.naturalWidth / rect.width;
        const scaleY = img.naturalHeight / rect.height;

        const cropX = Math.max(0, cropRect.x * scaleX);
        const cropY = Math.max(0, cropRect.y * scaleY);
        const cropSize = Math.min(img.naturalWidth - cropX, img.naturalHeight - cropY, cropRect.size * Math.min(scaleX, scaleY));

        const canvas = document.createElement('canvas');
        canvas.width = cropSize;
        canvas.height = cropSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);

        canvas.toBlob(blob => {
          URL.revokeObjectURL(cropImage);
          setCropImage(null);
          if (!blob) { reject(new Error('Crop failed')); return; }
          resolve(new File([blob], 'qr-cropped.png', { type: 'image/png' }));
        }, 'image/png', 0.92);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = cropImage;
    });
  };

  const handleCropConfirm = async () => {
    try {
      const cropped = await applyCrop();
      if (!cropped) return;
      setUploading(true);
      if (onQrFileUpload) {
        await onQrFileUpload(cropped);
      } else {
        onQrImageChange?.(URL.createObjectURL(cropped));
      }
      setUploading(false);
    } catch {
      setUploading(false);
      alert('Crop failed. Please try another image.');
    }
  };

  const handleCropCancel = () => {
    setCropImage(null);
  };

  const handleQrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    openCropModal(file);
  };

  const handleCropMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    setDragging({ type, startX: e.clientX, startY: e.clientY });
  };

  useEffect(() => {
    if (!dragging || !cropImage) return;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;

      setCropRect(prev => {
        if (dragging.type === 'move') {
          return {
            ...prev,
            x: Math.max(0, Math.min(prev.x + dx, 100 - prev.size)),
            y: Math.max(0, Math.min(prev.y + dy, 100 - prev.size)),
          };
        } else {
          const newSize = Math.max(40, Math.min(100 - prev.x, 100 - prev.y, prev.size + Math.max(dx, dy)));
          return { ...prev, size: newSize };
        }
      });
    };

    const handleUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, cropImage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }} viewport={{ once: true }}
      style={{ padding: '60px 20px', maxWidth: '560px', margin: '0 auto' }}
    >
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '1.4rem', color: theme.accent, marginBottom: '10px' }}>◇</div>
        <h2 style={{ color: theme.heading, fontFamily: 'inherit', fontStyle: 'italic', fontSize: '2rem', margin: '0 0 10px' }}>
          Gift of Love
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
          <span style={{ fontSize: '0.55rem', color: theme.accent }}>◆</span>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
        </div>
        <p style={{ color: theme.muted, fontSize: '0.88rem', marginTop: '12px', letterSpacing: '0.04em', lineHeight: 1.7 }}>
          Your presence is the greatest gift of all.<br />
          But if you wish to bless us further, we are grateful.
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '24px',
        padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.07)',
        textAlign: 'center',
      }}>
        {/* QR code with decorative frame */}
        <div style={{
          padding: '20px',
          background: '#ffffff',
          borderRadius: '24px',
          border: `1px solid ${theme.border}`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          position: 'relative',
          width: 280,
          height: 280,
display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           marginBottom: '24px',
         }}
         onMouseEnter={() => isEditing && setQrHovered(true)}
         onMouseLeave={() => isEditing && setQrHovered(false)}
         >
           {customQrImage && !qrImgError ? (
             <img
               src={customQrImage}
               alt="GCash QR Code"
               style={{ width: 240, height: 240, objectFit: 'contain', display: 'block' }}
               onError={() => setQrImgError(true)}
             />
           ) : (
             <QRCodeSVG
               value={gcashNumber}
               size={240}
               fgColor={theme.heading}
               bgColor="#ffffff"
             />
           )}

          {/* Upload overlay in edit mode */}
          {isEditing && (
            <div
              onClick={() => !uploading && qrInputRef.current?.click()}
              style={{
                position: 'absolute', 
                inset: 0, 
                borderRadius: '20px',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px', 
                cursor: uploading ? 'wait' : 'pointer', 
                background: (qrHovered || uploading) ? 'rgba(255,255,255,0.95)' : 'transparent',
                opacity: (qrHovered || uploading) ? 1 : 0,
                transition: 'opacity 0.2s, background 0.2s',
              }}
            >
              {uploading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: `3px solid ${theme.border}`, borderTopColor: theme.accent }}
                  />
                  <span style={{ color: theme.heading, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Uploading…
                  </span>
                </>
              ) : (
                <>
                  <div style={{
                    background: theme.accent, 
                    borderRadius: '50%',
                    width: '44px', 
                    height: '44px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.2rem', 
                    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                    color: '#fff',
                  }}>
                    📷
                  </div>
                  <span style={{
                    color: theme.heading, 
                    fontSize: '0.72rem', 
                    fontWeight: 700,
                    letterSpacing: '0.1em', 
                    textTransform: 'uppercase',
                  }}>
                    {customQrImage ? 'Change QR' : 'Upload QR'}
                  </span>
                </>
              )}
            </div>
          )}
          <input
            ref={qrInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleQrFile}
          />
        </div>

        {/* Number display */}
        <div style={{
          background: theme.giftBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '14px',
          padding: '14px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.muted, marginBottom: '4px' }}>
              GCash Number
            </div>
            {isEditing ? (
              <input
                type="text"
                value={gcashNumber}
                onChange={(e) => onGcashNumberChange?.(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: theme.heading,
                  letterSpacing: '0.08em',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            ) : (
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.heading, letterSpacing: '0.08em' }}>
                {gcashNumber}
              </div>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={copyToClipboard}
            style={{
              padding: '9px 18px',
              background: copied ? theme.accent : 'transparent',
              color: copied ? theme.accentText : theme.accent,
              border: `1.5px solid ${theme.accent}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </motion.button>
        </div>

        <p style={{ color: theme.muted, fontSize: '0.78rem', letterSpacing: '0.04em', margin: 0, lineHeight: 1.6 }}>
          Scan the QR code or copy the number above.<br />
          Thank you for your love and generosity. 🤍
        </p>
      </div>

      {cropImage && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: '#fffdf9', borderRadius: '20px', padding: '24px', maxWidth: '520px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#4a3f35', margin: '0 0 16px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
              Crop Your QR Code
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#7b6a5d', margin: '0 0 16px', textAlign: 'center' }}>
              Drag the square to select the QR code area, then confirm.
            </p>

<div
               ref={cropContainerRef}
               onMouseDown={(e) => handleCropMouseDown(e, 'move')}
               style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '12px', background: '#000', cursor: 'move', userSelect: 'none' }}
             >
               <img
                 src={cropImage}
                 alt="Crop preview"
                 style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                 draggable={false}
                 onError={() => { setCropImage(null); alert('Unable to load image. Please try another file.'); }}
               />

              <div
                onMouseDown={(e) => handleCropMouseDown(e, 'move')}
                style={{
                  position: 'absolute', left: `${cropRect.x}%`, top: `${cropRect.y}%`,
                  width: `${cropRect.size}%`, height: `${cropRect.size}%`,
                  border: '2px solid #fff', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  cursor: 'move',
                }}
              >
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'resize')}
                  style={{ position: 'absolute', right: -8, bottom: -8, width: 20, height: 20, background: '#b07f56', borderRadius: '50%', cursor: 'nwse-resize', border: '2px solid #fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={handleCropCancel} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #e5d9ce', background: '#fffdf9', color: '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleCropConfirm} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Confirm Crop</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Emily', 'Daniel', 'Jessica', 'Robert', 'Ashley',
  'Christopher', 'Amanda', 'David', 'Sophia', 'Matthew', 'Isabella', 'Anthony', 'Mia',
  'Mark', 'Charlotte', 'Donald', 'Amelia', 'Steven', 'Harper', 'Paul', 'Evelyn',
  'Andrew', 'Abigail', 'Joshua', 'Ella', 'Kevin', 'Scarlett', 'Brian', 'Victoria'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Young', 'Allen'
];

function generateRandomName(seed: string, index: number): string {
  const hashSeed = seed.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const rand1 = Math.abs((hashSeed + index * 17) % FIRST_NAMES.length);
  const rand2 = Math.abs((hashSeed + index * 23) % LAST_NAMES.length);
  return `${FIRST_NAMES[rand1]} ${LAST_NAMES[rand2]}`;
}

function EntourageSection({
  theme,
  entourage = {},
  isEditing = false,
}: {
  theme: any;
  entourage?: Record<string, string[]>;
  isEditing?: boolean;
}) {
  const ENTOURAGE_ROLES = [
    'Best Man',
    'Maid of Honor',
    'Bridesmaids',
    'Groomsmen',
    'Flower Girl',
    'Ring Bearer',
    'Bible Bearer',
    'Coin Bearer',
    'Veil Sponsors',
    'Cord Sponsors',
    'Principal Sponsors',
    'Secondary Sponsors',
  ];

  const getEntourageMembers = (role: string) => {
    const members = entourage[role] || [];
    if (!isEditing && members.length === 0) {
      // Generate example members for preview
      const exampleCount = role === 'Bridesmaids' ? 3 : role === 'Groomsmen' ? 3 : 1;
      return Array.from({ length: exampleCount }, (_, i) => generateRandomName(role, i));
    }
    return members.filter(m => m.trim() !== '');
  };

  const hasEntourage = Object.values(entourage).some(members => members.some(m => m.trim() !== ''));

  if (!hasEntourage && isEditing) {
    return null; // Don't show empty section in edit mode
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '1.4rem', color: theme.accent, marginBottom: '10px' }}>💍</div>
        <h2 style={{ color: theme.heading, fontFamily: 'inherit', fontStyle: 'italic', fontSize: '2rem', margin: '0 0 10px' }}>
          Our Special People
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
          <span style={{ fontSize: '0.55rem', color: theme.accent }}>◆</span>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}
        >
          {ENTOURAGE_ROLES.map((role) => {
            const members = getEntourageMembers(role);
            if (members.length === 0) return null;

            return (
              <div key={role}>
                <h3
                  style={{
                    color: theme.heading,
                    fontFamily: 'inherit',
                    fontSize: '1.1rem',
                    margin: '0 0 16px',
                    fontWeight: 600,
                    paddingBottom: '8px',
                    borderBottom: `2px solid ${theme.accent}`,
                  }}
                >
                  {role}
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {members.map((member, idx) => (
                    <li
                      key={idx}
                      style={{
                        color: theme.text,
                        fontSize: '0.95rem',
                        padding: '6px 0',
                        borderBottom: idx < members.length - 1 ? `1px solid ${theme.border}` : 'none',
                      }}
                    >
                      {member}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function DressCodeSection({
  theme,
  primaryColor = "#b07f56",
  secondaryColor = "#e5d9ce",
  dressCodeMessage = "We'd love to see you in our wedding colors!",
  isEditing = false,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onMessageChange
}: { 
  theme: TemplateDefinition['theme'];
  primaryColor?: string;
  secondaryColor?: string;
  dressCodeMessage?: string;
  isEditing?: boolean;
  onPrimaryColorChange?: (color: string) => void;
  onSecondaryColorChange?: (color: string) => void;
  onMessageChange?: (message: string) => void;
}) {
  // Helper function to get color name
  const getColorName = (hex: string): string => {
    const colorNames: Record<string, string> = {
      "#b07f56": "Warm Taupe",
      "#e5d9ce": "Soft Sand",
      "#ffffff": "White",
      "#000000": "Black",
      "#ff0000": "Red",
      "#00ff00": "Green",
      "#0000ff": "Blue",
      "#ffff00": "Yellow",
      "#ff00ff": "Magenta",
      "#00ffff": "Cyan",
      "#ff6b6b": "Coral",
      "#4ecdc4": "Teal",
      "#45b7d1": "Sky Blue",
      "#f9ca24": "Sunflower",
      "#6c5ce7": "Lavender",
      "#fd79a8": "Rose",
    };
    return colorNames[hex.toLowerCase()] || hex;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }} viewport={{ once: true }}
      style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto' }}
    >
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '1.4rem', color: theme.accent, marginBottom: '10px' }}>🎨</div>
        <h2 style={{ color: theme.heading, fontFamily: 'inherit', fontStyle: 'italic', fontSize: '2rem', margin: '0 0 10px' }}>
          Our Wedding Colors
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
          <span style={{ fontSize: '0.55rem', color: theme.accent }}>◆</span>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: theme.border }} />
        </div>
      </div>

      {/* Content */}
      <div style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
      }}>

        {/* Color preview with figures */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '32px',
          flexWrap: 'wrap',
        }}>
          {/* Woman figure */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              {/* Head */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#f5d6c6',
                marginBottom: '4px',
                border: '2px solid #e0c4b0',
              }} />
              {/* Dress */}
              <div style={{
                width: '70px',
                height: '100px',
                background: primaryColor,
                borderRadius: '35px 35px 10px 10px',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: theme.heading, fontWeight: 600, marginTop: '12px' }}>
              {getColorName(primaryColor)}
            </p>
          </div>

          {/* Man figure */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              {/* Head */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#f5d6c6',
                marginBottom: '4px',
                border: '2px solid #e0c4b0',
              }} />
              {/* Shirt */}
              <div style={{
                width: '54px',
                height: '50px',
                background: secondaryColor,
                borderRadius: '8px 8px 4px 4px',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              }} />
              {/* Pants */}
              <div style={{
                width: '54px',
                height: '50px',
                background: '#3a3a3a',
                borderRadius: '4px 4px 8px 8px',
                position: 'relative',
              }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: theme.heading, fontWeight: 600, marginTop: '12px' }}>
              {getColorName(secondaryColor)}
            </p>
          </div>
        </div>

        {/* Color pickers in edit mode */}
        {isEditing && (
          <div style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.75rem', color: theme.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => onPrimaryColorChange?.(e.target.value)}
                  style={{
                    width: '50px',
                    height: '50px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => onPrimaryColorChange?.(e.target.value)}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: theme.heading,
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <label style={{ fontSize: '0.75rem', color: theme.muted, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Secondary Color
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => onSecondaryColorChange?.(e.target.value)}
                  style={{
                    width: '50px',
                    height: '50px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => onSecondaryColorChange?.(e.target.value)}
                  style={{
                    width: '100px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: 'transparent',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: theme.heading,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        <div style={{ width: '100%', maxWidth: '600px' }}>
          {isEditing ? (
            <textarea
              value={dressCodeMessage}
              onChange={(e) => onMessageChange?.(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                background: theme.giftBg,
                fontSize: '0.95rem',
                color: theme.heading,
                fontFamily: 'inherit',
                minHeight: '80px',
                resize: 'vertical',
              }}
            />
          ) : (
            <p style={{
              color: theme.muted,
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              lineHeight: 1.7,
              textAlign: 'center',
              margin: 0,
            }}>
              {dressCodeMessage}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Home({ 
  invitationData, 
  isEditing, 
  plan = 'keepsake-200', 
  onPlanChange,
  gcashNumber = "09171234567",
  customQrImage = "",
  onGcashNumberChange,
  onQrImageChange,
  onQrFileUpload,
  dressCodePrimaryColor = "#b07f56",
  dressCodeSecondaryColor = "#e5d9ce",
  dressCodeMessage = "We'd love to see you in our wedding colors!",
  onDressCodePrimaryColorChange,
  onDressCodeSecondaryColorChange,
  onDressCodeMessageChange,
  entourage = {},
  onEntourageChange,
  coupleName,
  guestPhotoWallEnabled,
liveStreamUrl,
   templateId,
   onTemplateChange,
 }: {
   invitationData?: {
     names?: string;
     date?: string;
     venue?: string;
     message?: string;
     story?: string;
     musicUrl?: string;
     liveStreamUrl?: string;
    isGuestPhotoWallEnabled?: boolean;
    [key: string]: any;
  };
  isEditing?: boolean; 
  plan?: string; 
  onPlanChange?: (newPlan: string) => void;
  gcashNumber?: string;
  customQrImage?: string;
  onGcashNumberChange?: (number: string) => void;
  onQrImageChange?: (url: string) => void;
  onQrFileUpload?: (file: File) => Promise<void>;
  dressCodePrimaryColor?: string;
  dressCodeSecondaryColor?: string;
  dressCodeMessage?: string;
  onDressCodePrimaryColorChange?: (color: string) => void;
  onDressCodeSecondaryColorChange?: (color: string) => void;
  onDressCodeMessageChange?: (message: string) => void;
  entourage?: Record<string, string[]>;
  onEntourageChange?: (entourage: Record<string, string[]>) => void;
  coupleName?: string;
  guestPhotoWallEnabled?: boolean;
  liveStreamUrl?: string;
  templateId?: string;
onTemplateChange?: (templateId: string) => void;
 }) {
  const location = useLocation();
  const previewPlan = (location.state as any)?.previewPlan as string | undefined;
  const [wedding, setWedding] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0].id);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);

  useEffect(() => {
    if (templateId && templates.some(t => t.id === templateId)) {
      setSelectedTemplateId(templateId);
    }
  }, [templateId]);

  useEffect(() => {
    if (onTemplateChange) {
      onTemplateChange(selectedTemplateId);
    }
  }, [selectedTemplateId]);

  // Use previewPlan if provided (from landing page), otherwise use prop plan
  const effectivePlan = previewPlan || plan;

  useEffect(() => {
    if (invitationData && Object.keys(invitationData).length > 0) {
      setWedding(invitationData);
    } else {
      // Use default data when no invitationData is provided (public view or fallback)
      setWedding({
        couple: "Alex & Jordan",
        date: "2026-10-15",
        venue: "Grand Ballroom, Santa Cruz",
        message: "We can't wait to celebrate with you!",
        musicUrl: ''
      });
    }
  }, [invitationData]);

  // Plan feature gates (uses effectivePlan which includes preview support)
  const isStoryteller = ['storyteller', 'keepsake-20', 'keepsake-50', 'keepsake-100', 'keepsake-200'].includes(effectivePlan || '');
  const galleryLimit = effectivePlan === 'keepsake-200' ? 200 : effectivePlan === 'keepsake-100' ? 100 : effectivePlan === 'keepsake-50' ? 50 : effectivePlan === 'keepsake-20' ? 20 : isStoryteller ? 5 : 1;

  // Default gallery slots based on plan using picsum
  const defaultGallery = Array.from({ length: Math.min(galleryLimit, 10) }, (_, i) => [
    "https://picsum.photos/seed/g1/1200/900",
    "https://picsum.photos/seed/g2/1200/900",
    "https://picsum.photos/seed/g3/1200/900",
    "https://picsum.photos/seed/g4/1200/900",
    "https://picsum.photos/seed/g5/1200/900",
    "https://picsum.photos/seed/g6/1200/900",
    "https://picsum.photos/seed/g7/1200/900",
    "https://picsum.photos/seed/g8/1200/900",
    "https://picsum.photos/seed/g9/1200/900",
    "https://picsum.photos/seed/g10/1200/900"
  ][i % 10]);

  // Image state — hero, celebration banner, gallery slots, and story images
  const [heroImage, setHeroImage] = useState('');
  const [celebrationImage, setCelebrationImage] = useState('https://picsum.photos/seed/celebration/1400/900');
  const [galleryImages, setGalleryImages] = useState<string[]>(defaultGallery);
  const [storyImages, setStoryImages] = useState<string[]>([]);

  // Hero upload ref
  const heroInputRef = useRef<HTMLInputElement>(null);
  const celebrationInputRef = useRef<HTMLInputElement>(null);
  const [heroHovered, setHeroHovered] = useState(false);
  const [celebrationHovered, setCelebrationHovered] = useState(false);

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setHeroImage(URL.createObjectURL(file)); }
    e.target.value = '';
  };

  const handleCelebrationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setCelebrationImage(URL.createObjectURL(file)); }
    e.target.value = '';
  };

  const updateGalleryImage = (index: number, url: string) => {
    setGalleryImages(prev => prev.map((img, i) => i === index ? url : img));
  };

  const addNewGalleryImage = (url: string) => {
    setGalleryImages(prev => [...prev, url]);
  };
  
  const updateStoryImage = (index: number, url: string) => {
    setStoryImages(prev => {
      const newImages = [...prev];
      newImages[index] = url;
      return newImages;
    });
  };

// Update gallery when plan changes
  useEffect(() => {
    setGalleryImages(prev => {
      if (prev.length < Math.min(galleryLimit, 10)) {
        // Add new slots if needed
        const newImages = [...prev];
        for (let i = prev.length; i < Math.min(galleryLimit, 10); i++) {
          newImages.push([
            "https://picsum.photos/seed/g1/1200/900",
            "https://picsum.photos/seed/g2/1200/900",
            "https://picsum.photos/seed/g3/1200/900",
            "https://picsum.photos/seed/g4/1200/900",
            "https://picsum.photos/seed/g5/1200/900",
            "https://picsum.photos/seed/g6/1200/900",
            "https://picsum.photos/seed/g7/1200/900",
            "https://picsum.photos/seed/g8/1200/900",
            "https://picsum.photos/seed/g9/1200/900",
            "https://picsum.photos/seed/g10/1200/900"
          ][i % 10]);
        }
        return newImages;
      }
      // Keep existing images but don't exceed the limit
      return prev.slice(0, Math.min(galleryLimit, 10));
    });
  }, [galleryLimit]);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0];
  const display = invitationData || wedding;
  if (!display) return <h1>Loading Invitation...</h1>;
  
// Normalize the data for display (handle both prop and API formats)
   const normalized = {
    names: display.names || display.couple_names || display.couple || 'Alex & Jordan',
    date: display.date || display.wedding_date || '2026-10-15',
    venue: display.venue || 'Your Venue Here',
    message: display.message || display.description || '',
    story: display.story || myStory,
    musicUrl: display.musicUrl || display.music_url || '',
    liveStreamUrl: display.liveStreamUrl || display.live_stream_url || liveStreamUrl || '',
  };

  // Resolve hero: user-uploaded > template default
  const resolvedHero = heroImage || selectedTemplate.heroImage;

  return (
    <motion.div style={{ backgroundColor: selectedTemplate.theme.background, minHeight: '100vh', color: selectedTemplate.theme.text, fontFamily: selectedTemplate.font, overflowX: 'hidden' }}>
      <FloatingNav buttonStyle={{ borderColor: selectedTemplate.theme.navBorder, color: selectedTemplate.theme.navText, background: selectedTemplate.theme.navBg }} isPhotoWallEnabled={(invitationData?.isGuestPhotoWallEnabled ?? guestPhotoWallEnabled) || false} />

      {/* Hero — clickable to change in edit mode */}
      <div
        id="top"
        style={{ position: 'relative', backgroundImage: `linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0.28)), url('${resolvedHero}')`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center', padding: '60px 20px' }}
        onMouseEnter={() => isEditing && setHeroHovered(true)}
        onMouseLeave={() => isEditing && setHeroHovered(false)}
      >
        {/* Hero upload overlay */}
        {isEditing && (
          <>
            <div
              onClick={() => heroInputRef.current?.click()}
              style={{
                position: 'absolute', inset: 0, zIndex: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
                padding: '20px',
                opacity: heroHovered ? 1 : 0, transition: 'opacity 0.2s',
                background: heroHovered ? 'rgba(0,0,0,0.15)' : 'transparent',
              }}
            >
              <div style={{
                background: 'rgba(255,255,255,0.95)', borderRadius: '12px',
                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.78rem', fontWeight: 700, color: '#4a3f35',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)', letterSpacing: '0.06em',
              }}>
                📷 Change Hero Photo
              </div>
            </div>
            <input ref={heroInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeroUpload} />
          </>
        )}

        {/* Top ornament */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1 }}
          style={{ fontSize: '0.72rem', letterSpacing: '0.35em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '18px', fontWeight: 300 }}>
          Together with their families
        </motion.div>

        {/* Thin rule with diamond */}
        <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.9, delay: 0.25 }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', width: 'min(340px, 80vw)' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>◆</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
        </motion.div>

        {/* Couple names */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.35 }}
          style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', margin: '0', fontFamily: selectedTemplate.font, fontWeight: 700, fontStyle: 'italic', textShadow: '0 2px 24px rgba(0,0,0,0.45)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
          {normalized.names}
        </motion.h1>

        {/* Ampersand flourish — only if names contain & already, skip; otherwise show decorative line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '28px 0', width: 'min(380px, 85vw)' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.35)' }} />
          <span style={{ fontSize: '1rem', opacity: 0.75, letterSpacing: '0.2em' }}>✦ ✦ ✦</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.35)' }} />
        </motion.div>

        {/* Request line */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
          style={{ fontSize: '0.8rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.8, margin: '0 0 14px', fontWeight: 300 }}>
          request the honour of your presence
        </motion.p>

        {/* Date */}
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.75 }}
          style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', margin: '0 0 6px', letterSpacing: '0.18em', fontWeight: 400, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
          {normalized.date
            ? new Date(normalized.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Date to be announced'}
        </motion.p>

        {/* Time */}
        {normalized.date && new Date(normalized.date).getHours() + new Date(normalized.date).getMinutes() > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.82 }}
            style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', margin: '0 0 6px', letterSpacing: '0.22em', opacity: 0.85, fontWeight: 300 }}>
            {new Date(normalized.date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </motion.p>
        )}

        {/* Venue */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.9 }}
          style={{ fontSize: '0.82rem', letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.75, margin: '0 0 36px', fontWeight: 300 }}>
          {normalized.venue}
        </motion.p>

        {/* Bottom rule */}
        <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.9, delay: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', width: 'min(340px, 80vw)' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>◆</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
        </motion.div>

        {/* Countdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.1 }}>
          <Countdown
            targetDate={normalized.date || '2026-10-15T00:00'}
            accent={selectedTemplate.theme.accent}
            background="rgba(0,0,0,0.28)"
            text="#ffffff"
            border="rgba(255,255,255,0.25)"
            isPreview={false}
          />
        </motion.div>

      </div>
      {isEditing && <TemplatePicker templates={templates} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} floating />}
      <div style={{ padding: '50px 20px', textAlign: 'center' }}>
        <div
          id="celebration"
          style={{ position: 'relative', backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${celebrationImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '80px 20px', color: 'white', borderRadius: '20px', margin: '20px auto', maxWidth: '900px' }}
          onMouseEnter={() => isEditing && setCelebrationHovered(true)}
          onMouseLeave={() => isEditing && setCelebrationHovered(false)}
        >
          {isEditing && (
            <>
              <div
                onClick={() => celebrationInputRef.current?.click()}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '14px',
                  opacity: celebrationHovered ? 1 : 0, transition: 'opacity 0.2s',
                  background: celebrationHovered ? 'rgba(0,0,0,0.15)' : 'transparent',
                }}
              >
                <div style={{
                  background: 'rgba(255,255,255,0.95)', borderRadius: '10px',
                  padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700,
                  color: '#4a3f35', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                  📷 Change Photo
                </div>
              </div>
              <input ref={celebrationInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCelebrationUpload} />
            </>
          )}
          <h2 style={{ fontSize: '2.5rem', margin: '0' }}>The Celebration</h2>
          <p style={{ fontSize: '1.3rem', fontStyle: 'italic', marginTop: '10px' }}>{normalized.venue}</p>
        </div>

        {/* Our Journey — Storyteller + Keepsake only */}
        {isStoryteller && (
          <div id="journey">
            <StorySection 
              title="Our Journey" 
              content={normalized.story} 
              style={{ backgroundColor: selectedTemplate.theme.surface, borderColor: selectedTemplate.theme.border }} 
              textColor={selectedTemplate.theme.text} 
              headingColor={selectedTemplate.theme.heading}
              isEditing={isEditing}
              storyImages={storyImages}
              onStoryImageChange={updateStoryImage}
            />
          </div>
        )}

        {/* Gallery — Storyteller + Keepsake only */}
        {isStoryteller && (
          <div id="gallery">
          <PhotoGallery 
              images={galleryImages} 
              theme={selectedTemplate.theme} 
              isEditing={isEditing} 
              plan={plan}
              onImageChange={updateGalleryImage} 
              onAddImage={addNewGalleryImage}
              onDeleteImage={(index) => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
              onUpgradeClick={() => setUpgradeModalOpen(true)} 
            />
          </div>
        )}

        {/* Entourage — all plans */}
        <div id="entourage">
          {isEditing ? (
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '0' }}>
                <div style={{ flex: 1, height: '1px', background: selectedTemplate.theme.border }} />
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: selectedTemplate.theme.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ✦ Entourage Editor
                </span>
                <div style={{ flex: 1, height: '1px', background: selectedTemplate.theme.border }} />
              </div>
              <EntourageDashboardEditor
                entourage={entourage || {}}
                onChange={(newEntourage) => onEntourageChange?.(newEntourage)}
              />
            </div>
          ) : (
            <EntourageSection 
              theme={selectedTemplate.theme}
              entourage={entourage || {}}
              isEditing={false}
            />
          )}
        </div>

        {/* Dress Code/Colors — all plans */}
        <div id="dress-code">
          {isEditing ? (
            <div style={{ maxWidth: '900px', margin: '32px auto 0', padding: '0 20px', fontFamily: selectedTemplate.font }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1, height: '1px', background: selectedTemplate.theme.border }} />
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: selectedTemplate.theme.accent, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ✦ Our Wedding Colors
                </span>
                <div style={{ flex: 1, height: '1px', background: selectedTemplate.theme.border }} />
              </div>
              <div style={{ background: selectedTemplate.theme.surface, border: `1.5px solid ${selectedTemplate.theme.border}`, borderRadius: '20px', padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                {/* Swatch preview */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: dressCodePrimaryColor, margin: '0 auto 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: `3px solid ${selectedTemplate.theme.surface}` }} />
                    <span style={{ fontSize: '0.72rem', color: selectedTemplate.theme.muted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Primary</span>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: selectedTemplate.theme.border }}>✦</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: dressCodeSecondaryColor, margin: '0 auto 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: `3px solid ${selectedTemplate.theme.surface}` }} />
                    <span style={{ fontSize: '0.72rem', color: selectedTemplate.theme.muted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Secondary</span>
                  </div>
                </div>
                {/* Pickers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.72rem', letterSpacing: '0.13em', textTransform: 'uppercase', color: selectedTemplate.theme.muted, fontWeight: 600 }}>Primary Color</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={dressCodePrimaryColor} onChange={e => onDressCodePrimaryColorChange?.(e.target.value)}
                        style={{ width: '46px', height: '46px', border: `1.5px solid ${selectedTemplate.theme.border}`, borderRadius: '10px', cursor: 'pointer', padding: '2px' }} />
                      <input type="text" value={dressCodePrimaryColor} onChange={e => onDressCodePrimaryColorChange?.(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${selectedTemplate.theme.border}`, background: selectedTemplate.theme.section, color: selectedTemplate.theme.text, fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.72rem', letterSpacing: '0.13em', textTransform: 'uppercase', color: selectedTemplate.theme.muted, fontWeight: 600 }}>Secondary Color</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="color" value={dressCodeSecondaryColor} onChange={e => onDressCodeSecondaryColorChange?.(e.target.value)}
                        style={{ width: '46px', height: '46px', border: `1.5px solid ${selectedTemplate.theme.border}`, borderRadius: '10px', cursor: 'pointer', padding: '2px' }} />
                      <input type="text" value={dressCodeSecondaryColor} onChange={e => onDressCodeSecondaryColorChange?.(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1.5px solid ${selectedTemplate.theme.border}`, background: selectedTemplate.theme.section, color: selectedTemplate.theme.text, fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace' }} />
                    </div>
                  </div>
                </div>
                {/* Message */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.72rem', letterSpacing: '0.13em', textTransform: 'uppercase', color: selectedTemplate.theme.muted, fontWeight: 600 }}>Dress Code Message</label>
                  <textarea value={dressCodeMessage} onChange={e => onDressCodeMessageChange?.(e.target.value)} rows={2}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: `1.5px solid ${selectedTemplate.theme.border}`, background: selectedTemplate.theme.section, color: selectedTemplate.theme.text, fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
            </div>
          ) : (
            <DressCodeSection 
              theme={selectedTemplate.theme} 
              primaryColor={dressCodePrimaryColor}
              secondaryColor={dressCodeSecondaryColor}
              dressCodeMessage={dressCodeMessage}
              isEditing={false}
              onPrimaryColorChange={onDressCodePrimaryColorChange}
              onSecondaryColorChange={onDressCodeSecondaryColorChange}
              onMessageChange={onDressCodeMessageChange}
            />
          )}
        </div>

        {/* Gift of Love — Storyteller + Keepsake only */}
        {isStoryteller && (
          <div id="gift">
            <GiftSection 
              theme={selectedTemplate.theme} 
              gcashNumber={gcashNumber}
              customQrImage={customQrImage}
              isEditing={isEditing}
              onGcashNumberChange={onGcashNumberChange}
              onQrImageChange={onQrImageChange}
              onQrFileUpload={onQrFileUpload}
            />
          </div>
        )}

        {/* Live Stream — visible when URL is configured */}
        {normalized.liveStreamUrl && (
          <div id="livestream" style={{ margin: '40px auto', maxWidth: '900px', padding: '0 20px' }}>
            {(() => {
              const isReplay = normalized.date ? new Date(normalized.date).getTime() < Date.now() : false;
              return (
                <div style={{
                  padding: '24px',
                  background: selectedTemplate.theme.surface,
                  borderRadius: '20px',
                  border: `1px solid ${selectedTemplate.theme.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{isReplay ? '🎞️' : '📡'}</span>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: selectedTemplate.theme.heading, margin: '0 0 2px', fontFamily: selectedTemplate.font, fontWeight: 700 }}>
                        {isReplay ? 'Watch the Wedding Replay' : 'Live Stream'}
                      </h3>
                      {isReplay && (
                        <p style={{ fontSize: '0.75rem', color: selectedTemplate.theme.muted, margin: 0 }}>
                          The ceremony has ended — watch the full replay below.
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <button onClick={() => setShowLiveStream(v => !v)} style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      border: `1.5px solid ${selectedTemplate.theme.accent}`,
                      background: showLiveStream ? selectedTemplate.theme.accent : 'transparent',
                      color: showLiveStream ? '#fff' : selectedTemplate.theme.accent,
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      fontFamily: selectedTemplate.font,
                      transition: 'all 0.2s',
                    }}>
                      {showLiveStream
                        ? (isReplay ? '▼ Hide Replay' : '▼ Hide Stream')
                        : (isReplay ? '▶ Watch Replay' : '▶ Watch Live')}
                    </button>
                  </div>

                  {showLiveStream && (
                    <div style={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      aspectRatio: '16/9',
                      background: '#000',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}>
                      <LiveStreamEmbed url={normalized.liveStreamUrl} weddingDate={normalized.date} />
                    </div>
                  )}

                  <p style={{ fontSize: '0.78rem', color: selectedTemplate.theme.muted, marginTop: '10px', textAlign: 'center' }}>
                    {isReplay
                      ? `Ceremony took place on ${normalized.date ? new Date(normalized.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'your special day'}`
                      : `Join us live on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · Ceremony begins at ${normalized.date ? new Date(normalized.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD'}`
                    }
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* RSVP — all plans */}
        <div id="rsvp" style={{ margin: '40px auto', maxWidth: '900px', padding: '0 20px' }}>
          <RSVPForm 
            coupleName={coupleName || invitationData?.custom_url} 
            isEmbedded={true}
          />
        </div>

        {/* Photo Wall — when enabled */}
        {(invitationData?.isGuestPhotoWallEnabled ?? guestPhotoWallEnabled) && (
          <div id="photowall" style={{ margin: '40px auto', maxWidth: '1100px', padding: '0 20px' }}>
            <GuestPhotoWall coupleName={coupleName || invitationData?.custom_url} isEditing={isEditing} />
          </div>
        )}

        {/* Keepsake Plan Features Showcase */}
        {isEditing && (
          <div id="plan-features" style={{
            margin: '40px auto', maxWidth: '900px', padding: '32px',
            background: selectedTemplate.theme.surface, borderRadius: '20px',
            border: `1px solid ${selectedTemplate.theme.border}`,
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', color: selectedTemplate.theme.heading, 
              textAlign: 'center', margin: '0 0 24px', fontFamily: selectedTemplate.font, fontStyle: 'italic'
            }}>
              ✨ Your Plan Features
            </h2>

            {/* Feature Grid */}
            <div style={{ 
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px'
            }}>
              {/* Essential Features */}
              <div style={{
                padding: '20px', background: selectedTemplate.theme.section, borderRadius: '16px', border: `1px solid ${selectedTemplate.theme.border}`
              }}>
                <h3 style={{ fontSize: '1rem', color: selectedTemplate.theme.heading, margin: '0 0 12px' }}>
                  ✨ Essential Plan
                </h3>
                <ul style={{ listStyleType: 'none', padding: '0', margin: '0', fontSize: '0.88rem', color: selectedTemplate.theme.text }}>
                  <li style={{ marginBottom: '8px' }}>✓ Custom Couple Names</li>
                  <li style={{ marginBottom: '8px' }}>✓ Wedding Date & Venue</li>
                  <li style={{ marginBottom: '8px' }}>✓ Custom Invitation URL</li>
                  <li style={{ marginBottom: '8px' }}>✓ Countdown Timer</li>
                </ul>
              </div>

              {/* Storyteller Features */}
              <div style={{
                padding: '20px', background: selectedTemplate.theme.section, borderRadius: '16px', border: `1px solid ${selectedTemplate.theme.border}`
              }}>
                <h3 style={{ fontSize: '1rem', color: selectedTemplate.theme.heading, margin: '0 0 12px' }}>
                  📖 Storyteller Plan
                </h3>
                <ul style={{ listStyleType: 'none', padding: '0', margin: '0', fontSize: '0.88rem', color: selectedTemplate.theme.text }}>
                  <li style={{ marginBottom: '8px' }}>✓ All Essential Features</li>
                  <li style={{ marginBottom: '8px' }}>✓ Our Journey Story Section</li>
                  <li style={{ marginBottom: '8px' }}>✓ Photo Gallery (Up to 5 Photos)</li>
                  <li style={{ marginBottom: '8px' }}>✓ Gift of Love Section</li>
                  <li style={{ marginBottom: '8px' }}>✓ Background Music Player</li>
                </ul>
              </div>

              {/* Keepsake Features */}
              <div style={{
                padding: '20px', 
                background: effectivePlan?.includes('keepsake') 
                  ? `linear-gradient(135deg, ${selectedTemplate.theme.accent}22, ${selectedTemplate.theme.section})` 
                  : selectedTemplate.theme.section, 
                borderRadius: '16px', 
                border: `2px solid ${effectivePlan?.includes('keepsake') ? selectedTemplate.theme.accent : selectedTemplate.theme.border}`,
                boxShadow: effectivePlan?.includes('keepsake') ? `0 8px 32px ${selectedTemplate.theme.accent}33` : 'none'
              }}>
                <h3 style={{ fontSize: '1rem', color: selectedTemplate.theme.heading, margin: '0 0 12px' }}>
                  📸 Keepsake Plan {effectivePlan?.includes('keepsake') ? '(Active)' : ''}
                </h3>
                <ul style={{ listStyleType: 'none', padding: '0', margin: '0', fontSize: '0.88rem', color: selectedTemplate.theme.text }}>
                  <li style={{ marginBottom: '8px' }}>✓ All Storyteller Features</li>
                  <li style={{ marginBottom: '8px' }}>✓ Expanded Photo Gallery: {
                    effectivePlan === 'keepsake-200' ? 200 : effectivePlan === 'keepsake-100' ? 100 : effectivePlan === 'keepsake-50' ? 50 : 20
                    } Photos</li>
                  <li style={{ marginBottom: '8px' }}>✓ Customizable Hero Image</li>
                  <li style={{ marginBottom: '8px' }}>✓ Customizable Celebration Image</li>
                  <li style={{ marginBottom: '8px' }}>✓ Unlimited Story Length</li>
                  <li style={{ marginBottom: '8px' }}>✓ Priority Support</li>
                </ul>
              </div>
            </div>

            {/* Gallery Limit Indicator */}
            {isStoryteller && (
              <div style={{ 
                marginTop: '24px', padding: '16px', 
                background: selectedTemplate.theme.giftBg, 
                borderRadius: '12px', textAlign: 'center' 
              }}>
                <p style={{ color: selectedTemplate.theme.text, margin: '0', fontSize: '0.9rem' }}>
                  Current Gallery Capacity: <strong style={{ color: selectedTemplate.theme.accent }}>{galleryLimit} Photos</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Locked section notice for Essential plan */}
        {!isStoryteller && isEditing && (
          <div style={{
            margin: '40px auto', maxWidth: '560px', padding: '28px 32px',
            background: selectedTemplate.theme.surface, border: `1px dashed ${selectedTemplate.theme.border}`,
            borderRadius: '20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '10px' }}>🔒</div>
            <p style={{ color: selectedTemplate.theme.heading, fontWeight: 700, margin: '0 0 6px', fontFamily: selectedTemplate.font }}>
              Unlock More Sections
            </p>
            <p style={{ color: selectedTemplate.theme.muted, fontSize: '0.85rem', margin: '0 0 16px', lineHeight: 1.6 }}>
              Upgrade to the Storyteller or Keepsake plan to add Our Journey, Gallery, and Gift of Love sections.
            </p>
            <a href="/pricing" style={{
              display: 'inline-block', padding: '10px 24px', borderRadius: '20px',
              background: selectedTemplate.theme.buttonBg, color: selectedTemplate.theme.buttonText,
              fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.06em',
            }}>
              View Plans →
            </a>
          </div>
        )}

        {!isEditing && (
          <Link to="/login">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ marginTop: '40px', padding: '15px 40px', backgroundColor: selectedTemplate.theme.buttonBg, color: selectedTemplate.theme.buttonText, border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', boxShadow: '0 12px 24px rgba(0,0,0,0.12)', fontFamily: selectedTemplate.font }}>
              ✦ &nbsp;Login or Create Your Own
            </motion.button>
          </Link>
        )}
      </div>
      <MusicPlayer url={normalized.musicUrl || undefined} isEditing={isEditing} />
      
      <UpgradeModal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
        currentPlan={effectivePlan}
        onUpgrade={(newPlan) => {
          if (onPlanChange) {
            onPlanChange(newPlan);
          }
          setUpgradeModalOpen(false);
        }}
      />
    </motion.div>
  );
}

export default Home;

function LiveStreamEmbed({ url, weddingDate }: { url: string; weddingDate?: string }) {
  // Determine if the wedding has already passed
  const isReplay = weddingDate ? new Date(weddingDate).getTime() < Date.now() : false;

  const videoId = (() => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  })();

  // For non-YouTube URLs after the event, show a replay link card
  if (!videoId) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', color: '#fff', padding: '32px', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{isReplay ? '🎞️' : '📡'}</div>
          <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px' }}>{isReplay ? 'Watch the Wedding Replay' : 'Live Stream'}</p>
          <p style={{ fontSize: '0.82rem', margin: '0 0 16px', opacity: 0.65 }}>
            {isReplay ? 'The ceremony has ended. Click below to watch the full replay.' : 'Stream available at:'}
          </p>
          <a href={url} target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', padding: '10px 24px', borderRadius: '20px', background: '#b07f56', color: '#fff', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.04em' }}>
            {isReplay ? '▶ Watch Replay' : 'Open Stream →'}
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=0`}
      frameBorder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      style={{ display: 'block' }}
      title={isReplay ? 'Wedding Replay' : 'Live Stream'}
    />
  );
}