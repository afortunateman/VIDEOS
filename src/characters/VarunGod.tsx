import React from 'react';
import {FacePalette, VarunFaceProfile, VarunFaceThreeQuarter, FaceState} from './VarunFace';
import {ForearmOnDesk, HAND_GOD, HandPalette, HandSideTap} from './Hands';
import {OFFICE} from '../props/Office';

/**
 * God Varun: lives outside the globe, in the office. Shirt, rolled sleeves, warm
 * lamp-lit skin, no winter clothes. Shares VarunFace with globe Varun.
 */

// Base (unlit) colours for the dark office. Light passes add the lamp and screen on top.
export const GOD_FACE_DARK: FacePalette = {
  skin: '#64412E',
  skinShade: '#462C1F',
  hair: '#0E0B0B',
  hairShine: '#2D2A33',
  lip: '#4F2C22',
  eye: '#0B0807',
  eyeWhite: '#B9B4B2',
  brow: '#0E0A09',
};

export const GOD_HAND_DARK: HandPalette = {
  skin: '#6A3F27',
  shade: '#4A2A19',
  deep: '#341D11',
  nail: '#9C7562',
  crease: '#3E2316',
};

export const GOD_SHIRT = {base: '#5E636C', shade: '#41454E', deep: '#30333A', cuff: '#686C75'};
export const GOD_TROUSERS = {base: '#23262D', shade: '#181A1F'};

export type SeatedPose = {
  /** Head pitch in degrees (+ = nose down). */
  headTilt?: number;
  /** Breathing 0..1 phase amplitude already applied by caller (−1..1). */
  breath?: number;
  /** Torso lean in degrees (+ = forward toward the desk). */
  lean?: number;
  blink?: number;
  lookX?: number;
  lookY?: number;
  state?: FaceState;
};

const NECK = {x: 694, y: 416};
const HIP = {x: 640, y: 790};

/** The far (right) upper arm reaching toward the desk. Drawn before the torso. */
export const VarunGodFarUpperArm: React.FC<{lean?: number}> = ({lean = 0}) => (
  <g transform={`rotate(${lean} ${HIP.x} ${HIP.y})`}>
    <path d="M 690 448 C 712 440 734 452 742 470 L 790 604 C 780 616 760 622 748 614 L 700 500 Z" fill={GOD_SHIRT.deep} />
    {/* rolled cuff at the elbow */}
    <path d="M 742 590 C 758 584 778 588 792 598 L 796 616 C 782 626 760 628 744 620 Z" fill={GOD_SHIRT.shade} />
  </g>
);

export const VarunGodSeatedProfile: React.FC<SeatedPose & {face?: FacePalette}> = ({
  headTilt = 8,
  breath = 0,
  lean = 0,
  blink = 0,
  lookX = 0.8,
  lookY = 0.6,
  state = 'neutral',
  face = GOD_FACE_DARK,
}) => {
  const chest = breath * 2.2;
  return (
    <g>
      {/* trousers: thigh runs forward under the desk */}
      <path
        d="M 604 736 L 766 740 C 812 748 888 758 940 766 C 954 782 952 818 934 830 C 860 834 700 834 618 826 C 602 806 600 770 604 736 Z"
        fill={GOD_TROUSERS.base}
      />
      <path d="M 892 822 L 940 818 L 958 1010 L 906 1010 Z" fill={GOD_TROUSERS.shade} />
      <path d="M 640 820 C 720 826 840 828 930 826" stroke={GOD_TROUSERS.shade} strokeWidth={6} fill="none" opacity={0.7} />

      <g transform={`rotate(${lean} ${HIP.x} ${HIP.y})`}>
        {/* torso (shirt) */}
        <g transform={`translate(0 ${-chest * 0.4}) `}>
          <path
            d={`M 658 414 C 630 432 612 478 606 538 C 600 600 603 670 608 744 L 764 748
               C 770 700 ${772 + chest} 640 ${770 + chest} 588 C ${768 + chest} 540 760 494 748 462 C 740 442 728 428 714 420 Z`}
            fill={GOD_SHIRT.base}
          />
          {/* back in shade, side seam, folds */}
          <path d="M 658 414 C 630 432 612 478 606 538 C 600 600 603 670 608 744 L 632 744 C 626 670 626 600 632 540 C 638 484 650 446 672 424 Z" fill={GOD_SHIRT.shade} opacity={0.8} />
          <path d="M 700 470 C 702 560 700 650 690 744" stroke={GOD_SHIRT.shade} strokeWidth={2.5} fill="none" opacity={0.6} />
          <path d="M 742 600 C 726 640 724 690 734 740" stroke={GOD_SHIRT.shade} strokeWidth={2} fill="none" opacity={0.5} />
          <path d="M 762 520 C 750 534 742 556 742 580" stroke={GOD_SHIRT.deep} strokeWidth={2} fill="none" opacity={0.45} />
          {/* belt */}
          <rect x={606} y={738} width={160} height={10} fill="#141518" />
          <rect x={742} y={738} width={12} height={10} fill="#6F6556" opacity={0.6} />
        </g>

        {/* head + neck, pivoting at the neck */}
        <g transform={`rotate(${headTilt} ${NECK.x} ${NECK.y})`}>
          <g transform="translate(712 318) scale(0.8)">
            <VarunFaceProfile state={state} blink={blink} lookX={lookX} lookY={lookY} palette={face} />
          </g>
        </g>
        {/* open collar */}
        <path d="M 662 410 C 676 426 698 434 722 430 L 726 444 C 702 450 678 444 660 428 Z" fill={GOD_SHIRT.cuff} />
        <path d="M 712 428 C 724 440 734 452 742 466 L 736 470 C 726 458 716 446 706 434 Z" fill={GOD_SHIRT.shade} />
        {/* near (left) arm: shoulder down to elbow, forearm resting on the thigh */}
        <g>
          <path d="M 650 446 C 676 432 708 440 712 470 L 706 630 C 694 644 664 646 652 632 L 646 500 Z" fill={GOD_SHIRT.base} />
          <path d="M 650 446 C 640 470 642 520 648 630 L 662 636 C 656 560 654 500 664 452 Z" fill={GOD_SHIRT.shade} opacity={0.7} />
          {/* rolled cuff */}
          <path d="M 648 612 C 664 604 696 604 712 612 L 714 640 C 698 650 664 650 648 640 Z" fill={GOD_SHIRT.cuff} />
          <path d="M 650 626 C 666 620 694 620 712 626" stroke={GOD_SHIRT.shade} strokeWidth={1.6} fill="none" />
          {/* forearm */}
          <path d="M 656 636 C 668 650 700 652 712 640 L 812 726 C 806 744 788 752 774 746 Z" fill={face.skin} />
          {/* hand resting on the thigh, fingers draped */}
          <path d="M 790 722 C 816 716 846 724 858 738 C 864 748 860 760 848 762 C 830 764 806 760 786 750 C 776 744 778 728 790 722 Z" fill={face.skin} />
          <path d="M 846 740 C 856 748 858 756 852 762" stroke={face.skinShade} strokeWidth={2} fill="none" />
          <path d="M 836 742 C 846 752 846 760 840 764" stroke={face.skinShade} strokeWidth={2} fill="none" />
        </g>
      </g>
    </g>
  );
};

/** Far forearm + hand on the desk. `lift` raises the index finger for a tap. */
export const VarunGodDeskHand: React.FC<{lift?: number; curl?: number; palette?: HandPalette; length?: number}> = ({
  lift = 0,
  curl = 0,
  palette = GOD_HAND_DARK,
  length = 80,
}) => {
  const {x, y, scale} = OFFICE.hand;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ForearmOnDesk length={length} palette={palette} showSleeve={false} />
      <HandSideTap lift={lift} curl={curl} palette={palette} />
    </g>
  );
};

export {HAND_GOD, VarunFaceThreeQuarter};

/**
 * Close-up bust in three-quarter view (face turned toward frame-left).
 * Local space: same as VarunFaceThreeQuarter (head ~200 units tall, origin mid-skull).
 */
export const VarunGodCloseUp: React.FC<{
  blink?: number;
  lookX?: number;
  lookY?: number;
  state?: FaceState;
  /** Shoulder rise from breathing, local units. */
  breath?: number;
  /** Head pitch in degrees (+ = chin down). */
  headTilt?: number;
  face?: FacePalette;
  catchlight?: number;
}> = ({blink = 0, lookX = 0, lookY = 0, state = 'neutral', breath = 0, headTilt = 0, face = GOD_FACE_DARK, catchlight = 0.8}) => (
  <g>
    {/* shoulders and shirt */}
    <g transform={`translate(0 ${-breath})`}>
      <path d="M -360 430 C -330 240 -230 150 -90 128 L 110 124 C 250 144 330 230 350 430 Z" fill={GOD_SHIRT.base} />
      {/* far shoulder falls into shade */}
      <path d="M -360 430 C -330 240 -230 150 -90 128 L -60 134 C -170 180 -240 290 -260 430 Z" fill={GOD_SHIRT.shade} opacity={0.75} />
      {/* skin in the open neck */}
      <path d="M -40 96 L 60 92 L 36 190 L 8 244 L -20 190 Z" fill={face.skinShade} />
      <path d="M -18 150 C -4 158 16 158 32 150" stroke={face.skin} strokeWidth={3} fill="none" opacity={0.3} />
      {/* collar wraps the neck and falls open */}
      <path d="M -44 90 C -60 100 -80 120 -92 142 L -96 178 L -22 230 L -8 150 C -20 128 -34 110 -44 90 Z" fill={GOD_SHIRT.cuff} />
      <path d="M 62 86 C 80 96 100 116 114 140 L 118 176 L 34 230 L 22 150 C 36 126 50 108 62 86 Z" fill={GOD_SHIRT.cuff} />
      <path d="M -8 150 L -22 230" stroke={GOD_SHIRT.shade} strokeWidth={2} opacity={0.6} />
      <path d="M 22 150 L 34 230" stroke={GOD_SHIRT.shade} strokeWidth={2} opacity={0.6} />
      {/* placket meets at the first fastened button */}
      <path d="M -22 230 L 8 250 L 34 230" fill="none" stroke={GOD_SHIRT.deep} strokeWidth={2.5} opacity={0.7} />
      <path d="M -92 176 L -22 228 L -26 236 Z" fill={GOD_SHIRT.deep} opacity={0.6} />
      <path d="M 7 228 L 10 430" stroke={GOD_SHIRT.shade} strokeWidth={3} opacity={0.6} />
      <circle cx={9} cy={270} r={4} fill={GOD_SHIRT.cuff} />
      <circle cx={10} cy={350} r={4} fill={GOD_SHIRT.cuff} />
      <path d="M 200 200 C 236 260 246 330 240 430" stroke={GOD_SHIRT.shade} strokeWidth={3} fill="none" opacity={0.5} />
    </g>
    <g transform={`rotate(${headTilt} 10 150)`}>
      <VarunFaceThreeQuarter state={state} blink={blink} lookX={lookX} lookY={lookY} palette={face} catchlight={catchlight} />
    </g>
  </g>
);
