import React from 'react';
import {C, Soft} from './Room';
import {HandSideTap, HandPalette} from '../characters/Hands';
import {LightPass} from '../art/LightPass';

/** Style test: god Varun, seated in profile, painted with soft clipped light. */

const SKIN = '#86502f';
const SKIN_DEEP = '#4a2818';
const HAIR = '#0e0a09';

const HEAD =
  'M -38 40 C -62 10 -66 -50 -40 -82 C -14 -108 34 -108 56 -82 C 66 -70 70 -50 70 -36 C 71 -30 74 -26 73 -22 ' +
  'C 70 -17 70 -14 72 -10 C 80 2 90 16 95 26 C 97 30 93 34 86 33 C 82 33 79 34 79 37 C 80 41 83 44 82 47 ' +
  'C 80 48 78 48 79 50 C 82 53 80 57 76 58 C 73 59 72 61 73 64 C 76 72 74 82 64 86 C 52 90 36 86 24 80 ' +
  'C 12 74 0 66 -6 56 C -14 48 -28 44 -38 40 Z';
const NECK = 'M 20 78 C 28 92 34 102 38 110 C 36 120 40 136 46 160 L -36 160 C -32 120 -34 76 -40 40 C -30 56 0 72 20 78 Z';
const FRONT_EDGE =
  'M 56 -82 C 66 -70 70 -50 70 -36 C 71 -30 74 -26 73 -22 C 70 -17 70 -14 72 -10 C 80 2 90 16 95 26 C 97 30 93 34 86 33 ' +
  'C 82 33 79 34 79 37 C 80 41 83 44 82 47 C 80 48 78 48 79 50 C 82 53 80 57 76 58 C 73 59 72 61 73 64 C 76 72 74 82 64 86';
const HAIR_PATH =
  'M 60 -74 C 70 -70 78 -62 81 -52 C 73 -57 67 -59 62 -60 C 58 -56 52 -54 44 -56 C 30 -50 20 -40 14 -30 L 12 -6 L 4 -6 ' +
  'L 2 -26 C -6 -30 -16 -30 -24 -22 C -32 -8 -38 14 -44 34 C -54 30 -66 10 -72 -16 C -80 -50 -66 -96 -36 -116 ' +
  'C -10 -132 30 -132 52 -116 C 66 -106 70 -90 60 -74 Z';

const Head: React.FC = () => (
  <g>
    <defs>
      <clipPath id="stHeadClip">
        <path d={HEAD} />
        <path d={NECK} />
      </clipPath>
      <clipPath id="stHairClip">
        <path d={HAIR_PATH} />
      </clipPath>
    </defs>
    {/* skin */}
    <path d={NECK} fill={SKIN} />
    <path d={HEAD} fill={SKIN} />
    <g clipPath="url(#stHeadClip)">
      {/* form shadow: back of the head, jaw, neck turn away from the screen */}
      <Soft d="M -80 -120 L 20 -120 C 10 -40 0 30 40 70 L 60 200 L -80 200 Z" fill={SKIN_DEEP} o={0.85} blur={10} />
      <Soft d="M 10 80 C 30 92 50 96 70 90 L 70 170 L 10 170 Z" fill={SKIN_DEEP} o={0.7} blur={6} />
      {/* eye socket and under the brow */}
      <Soft d="M 50 -26 C 58 -28 68 -24 72 -18 C 68 -8 58 -6 50 -10 Z" fill={SKIN_DEEP} o={0.55} blur={4} />
      {/* cheekbone plane */}
      <Soft d="M 30 4 C 44 -2 58 2 66 12 C 54 16 40 16 30 12 Z" fill={SKIN_DEEP} o={0.3} blur={4} />
      {/* cold screen key on the front of the face */}
      <Soft d="M 54 -90 C 80 -60 110 0 100 60 C 90 90 70 100 54 96 C 62 60 52 10 40 -30 C 40 -60 44 -80 54 -90 Z" fill="#b9cbea" o={0.55} blur={10} blend="screen" />
      {/* warm bounce from the lamp-lit desk under the nose and chin */}
      <Soft d="M 70 30 C 84 34 92 40 90 46 C 80 46 72 40 70 30 Z" fill="#ff9a5a" o={0.35} blur={3} blend="screen" />
      <Soft d="M 30 84 C 50 92 66 92 76 86 C 70 104 46 108 30 98 Z" fill="#ff9a5a" o={0.35} blur={5} blend="screen" />
      {/* bright rim of screen light right on the profile */}
      <path d={FRONT_EDGE} stroke="#e4eeff" strokeWidth={5} fill="none" opacity={0.6} filter="url(#stBlur2)" />
      {/* cool rim from the window behind, along the nape */}
      <path d="M -40 40 C -34 76 -32 120 -36 160" stroke="#7fa0d0" strokeWidth={6} fill="none" opacity={0.45} filter="url(#stBlur2)" />
      {/* adam's apple */}
      <Soft d="M 34 100 C 40 104 42 112 38 118 C 34 112 32 106 34 100 Z" fill="#c9d6ee" o={0.35} blur={2} blend="screen" />
    </g>

    {/* ear */}
    <path d="M -12 -22 C 4 -28 12 -12 10 4 C 9 18 0 26 -10 22 C -18 18 -24 -16 -12 -22 Z" fill="#6e3f25" />
    <path d="M -6 -14 C 4 -12 5 2 2 10" stroke="#3a1e12" strokeWidth={2.4} fill="none" strokeLinecap="round" />
    <path d="M -12 -22 C 4 -28 12 -12 10 4" stroke="#d48a58" strokeWidth={1.6} fill="none" opacity={0.5} />

    {/* eye: lid lowered, looking down at the screen */}
    <path d="M 56 -16 Q 62 -18 68 -14 Q 63 -11 57 -12 Z" fill="#d7dcea" opacity={0.75} />
    <circle cx={65} cy={-13.5} r={2.6} fill="#120a07" />
    <circle cx={66.2} cy={-14.6} r={0.8} fill="#eef5ff" />
    <path d="M 54 -18 Q 62 -22 70 -14" stroke="#120a07" strokeWidth={3} fill="none" strokeLinecap="round" />
    <path d="M 55 -23 Q 62 -26 68 -20" stroke={SKIN_DEEP} strokeWidth={1.4} fill="none" opacity={0.7} />
    <path d="M 57 -11 Q 62 -9 67 -11.5" stroke={SKIN_DEEP} strokeWidth={1} fill="none" opacity={0.6} />
    {/* brow */}
    <path d="M 44 -30 C 54 -37 66 -37 76 -31 C 70 -29.5 60 -30 46 -27 Z" fill="#100b0a" />
    {/* nostril, smile fold, mouth */}
    <path d="M 80 28 C 83 31 87 31 89 29" stroke="#2a140b" strokeWidth={2} fill="none" strokeLinecap="round" />
    <path d="M 77 32 C 71 40 70 48 72 55" stroke={SKIN_DEEP} strokeWidth={1.6} fill="none" opacity={0.55} />
    <path d="M 79 37 C 80 41 83 44 82 47 C 79 47.5 76 48 73 49 Z" fill="#5c2c1d" opacity={0.6} />
    <path d="M 80 49.5 L 70 50" stroke="#2a120a" strokeWidth={1.8} strokeLinecap="round" />
    <path d="M 79 51 C 81 53 80 56 76 58" stroke="#c98a6a" strokeWidth={1.2} fill="none" opacity={0.5} />

    {/* hair */}
    <path d={HAIR_PATH} fill={HAIR} />
    <g clipPath="url(#stHairClip)">
      {/* soft sheen: screen on the front of the hair, a whisper of window light at the back */}
      <Soft d="M 20 -136 C 60 -124 84 -90 82 -56 L 60 -58 C 58 -88 44 -112 14 -128 Z" fill="#3c4f74" o={0.55} blur={8} blend="screen" />
      <Soft d="M -84 -50 C -80 -20 -70 10 -54 34 L -50 10 C -62 -10 -70 -30 -74 -56 Z" fill="#2f4468" o={0.35} blur={6} blend="screen" />
      {/* a few locks, barely lighter than the hair */}
      {[
        'M -30 -118 C 0 -128 36 -118 64 -82',
        'M -60 -84 C -30 -110 10 -108 40 -76',
        'M 10 -124 C 40 -116 62 -94 78 -60',
      ].map((d, i) => (
        <path key={i} d={d} stroke="#26304a" strokeWidth={2.2} fill="none" opacity={0.55} strokeLinecap="round" filter="url(#stBlur2)" />
      ))}
      {/* fringe lock falling over the forehead */}
      <path d="M 40 -98 C 64 -90 80 -70 82 -50 C 74 -62 62 -72 46 -78 Z" fill="#1a1f2c" />
    </g>
    {/* flyaway strands */}
    <path d="M 10 -128 C 18 -136 26 -138 34 -134" stroke={HAIR} strokeWidth={2.5} fill="none" strokeLinecap="round" />
    <path d="M -20 -126 C -16 -136 -8 -140 0 -138" stroke={HAIR} strokeWidth={2} fill="none" strokeLinecap="round" />
    <path d="M 74 -60 C 80 -54 82 -46 80 -40" stroke={HAIR} strokeWidth={2.5} fill="none" strokeLinecap="round" />
  </g>
);

// ---------------------------------------------------------------------------
// Body (world coordinates)
// ---------------------------------------------------------------------------
const TORSO =
  'M 672 436 C 646 452 626 492 618 552 C 610 610 610 690 614 752 L 770 756 C 776 700 782 640 780 594 ' +
  'C 778 540 768 498 756 470 C 746 452 734 442 720 436 Z';
const UPPER_NEAR = 'M 652 452 C 680 438 714 446 718 476 L 712 632 C 700 646 668 648 656 634 L 648 504 Z';
const FOREARM_NEAR = 'M 662 638 C 676 652 706 652 716 640 L 816 724 C 810 742 792 750 778 744 Z';
const HAND_NEAR = 'M 792 720 C 818 714 850 722 862 736 C 868 746 864 758 852 760 C 834 762 808 758 788 748 C 778 742 780 726 792 720 Z';
const TROUSERS =
  'M 604 738 L 772 742 C 820 750 900 760 948 770 C 962 786 960 822 942 834 C 868 838 704 838 620 830 C 604 808 600 772 604 738 Z';
const SHIN = 'M 900 826 L 950 820 L 962 866 L 914 870 Z';
const FAR_UPPER = 'M 696 452 C 718 444 742 456 750 476 L 800 600 C 790 614 768 620 756 612 L 706 500 Z';
const FAR_FOREARM = 'M 778 582 C 810 582 840 586 866 570 L 868 616 C 840 617 810 618 780 618 Z';

const SHIRT = '#6a7487';
const SHIRT_DEEP = '#2c3445';

const HAND_PAL: HandPalette = {skin: '#a8663a', shade: '#6e3a1e', deep: '#4a2412', nail: '#e2b08e', crease: '#5a2a14'};

export const VarunStyle: React.FC<{lift?: number}> = ({lift = 0}) => (
  <g>
    <defs>
      <clipPath id="stTorsoClip">
        <path d={TORSO} />
      </clipPath>
      <clipPath id="stNearArmClip">
        <path d={UPPER_NEAR} />
      </clipPath>
      <clipPath id="stTrouserClip">
        <path d={TROUSERS} />
        <path d={SHIN} />
      </clipPath>
    </defs>

    {/* trousers and shoe */}
    <path d={TROUSERS} fill="#20232b" />
    <path d={SHIN} fill="#191b21" />
    <g clipPath="url(#stTrouserClip)">
      <Soft d="M 600 820 L 980 820 L 980 860 L 600 860 Z" fill="#000" o={0.6} blur={10} />
      <Soft d="M 640 742 C 760 748 880 758 950 772 L 950 790 C 860 780 740 770 640 762 Z" fill="#5b6a86" o={0.4} blur={6} blend="screen" />
      <path d="M 660 800 C 740 806 820 812 900 816" stroke="#0c0d10" strokeWidth={4} fill="none" opacity={0.7} filter="url(#stBlur2)" />
    </g>
    <path d="M 906 866 L 968 862 C 990 862 1000 874 996 880 L 904 880 Z" fill="#0b0a09" />
    <path d="M 920 864 L 966 862" stroke="#6a7fa0" strokeWidth={1.5} opacity={0.5} />

    {/* far arm: upper arm reaching toward the desk, mostly behind the torso */}
    <path d={FAR_UPPER} fill={SHIRT_DEEP} />
    <path d="M 750 584 C 768 578 790 582 804 592 L 806 614 C 790 624 768 626 752 618 Z" fill="#59647a" />

    {/* head, slouched forward and tilted down toward the screen (drawn before the shirt so the collar sits over the neck) */}
    <g transform="translate(736 352) rotate(11) scale(0.94)">
      <Head />
    </g>

    {/* torso */}
    <path d={TORSO} fill={SHIRT} />
    <g clipPath="url(#stTorsoClip)">
      <Soft d="M 560 400 L 680 400 C 660 520 660 640 690 800 L 560 800 Z" fill={SHIRT_DEEP} o={0.9} blur={16} />
      <Soft d="M 770 450 C 800 520 806 640 790 760 L 756 760 C 764 640 760 520 744 450 Z" fill="#c9d8f0" o={0.4} blur={12} blend="screen" />
      {/* folds pulled toward the desk */}
      {[
        'M 700 480 C 704 560 702 650 690 752',
        'M 740 600 C 726 640 722 700 732 752',
        'M 764 520 C 750 534 742 556 742 584',
        'M 712 700 C 730 712 752 718 772 718',
      ].map((d, i) => (
        <g key={i}>
          <path d={d} stroke={SHIRT_DEEP} strokeWidth={5} fill="none" opacity={0.55} filter="url(#stBlur2)" />
          <path d={d} stroke="#c9d8f0" strokeWidth={1.5} fill="none" opacity={0.25} transform="translate(3 0)" />
        </g>
      ))}
      {/* window rim on the back */}
      <path d="M 668 438 C 640 452 616 492 606 552 C 598 610 600 690 606 752" stroke="#8fb0e0" strokeWidth={6} fill="none" opacity={0.55} filter="url(#stBlur2)" />
      {/* belt */}
      <rect x={600} y={738} width={180} height={12} fill="#120f0d" />
      <rect x={754} y={738} width={12} height={12} fill="#8a7a5a" opacity={0.7} />
    </g>

    {/* open collar */}
    <path d="M 670 424 C 684 440 706 448 730 444 L 734 460 C 710 466 684 460 664 444 Z" fill="#a8b4c8" />
    <path d="M 722 442 C 734 454 746 468 754 484 L 746 488 C 736 474 724 460 714 448 Z" fill="#5d6a80" />
    <path d="M 726 444 C 734 452 740 460 746 470" stroke="#e4eeff" strokeWidth={1.4} opacity={0.5} />

    {/* near arm resting on the thigh; it shadows the torso behind it */}
    <Soft d="M 640 460 C 690 450 730 470 734 500 L 730 650 L 660 660 Z" fill="#0b0f18" o={0.45} blur={10} />
    <path d={UPPER_NEAR} fill="#5d677b" />
    <g clipPath="url(#stNearArmClip)">
      <Soft d="M 630 440 L 670 440 C 666 520 668 580 676 650 L 630 650 Z" fill={SHIRT_DEEP} o={0.85} blur={10} />
      <Soft d="M 712 450 C 730 520 726 590 716 650 L 700 650 C 708 580 708 520 700 450 Z" fill="#c9d8f0" o={0.4} blur={6} blend="screen" />
      <path d="M 652 452 C 646 470 646 500 648 504 L 656 634" stroke="#8fb0e0" strokeWidth={4} fill="none" opacity={0.5} filter="url(#stBlur2)" />
      <path d="M 660 520 C 676 530 696 530 712 520" stroke={SHIRT_DEEP} strokeWidth={4} fill="none" opacity={0.5} filter="url(#stBlur2)" />
    </g>
    {/* rolled cuff */}
    <path d="M 650 610 C 666 602 700 602 716 610 L 718 642 C 702 652 666 652 650 642 Z" fill="#9aa6ba" />
    <path d="M 652 626 C 668 620 698 620 716 626" stroke={SHIRT_DEEP} strokeWidth={2} fill="none" />
    <path d="M 650 642 C 666 652 702 652 718 642" stroke="#000" strokeWidth={3} fill="none" opacity={0.3} />
    {/* forearm + hand on thigh, in the shadow under the desk */}
    <path d={FOREARM_NEAR} fill="#5e3420" />
    <path d={HAND_NEAR} fill="#5e3420" />
    <path d="M 850 740 C 858 748 860 756 854 762" stroke="#2e170c" strokeWidth={2} fill="none" />
    <path d="M 838 744 C 848 754 848 762 842 766" stroke="#2e170c" strokeWidth={2} fill="none" />
    <path d="M 716 640 L 816 724" stroke="#b9cbea" strokeWidth={2} opacity={0.35} />

    {/* far forearm and the tapping hand, in the lamp light */}
    {(() => {
      const arm = (
        <g>
          <path d={FAR_FOREARM} fill={HAND_PAL.skin} />
          <path d="M 780 608 C 820 610 846 610 868 606 L 868 616 C 846 617 810 618 780 618 Z" fill={HAND_PAL.shade} />
          <g transform="translate(862 617) scale(1.6)">
            <HandSideTap lift={lift} palette={HAND_PAL} />
          </g>
        </g>
      );
      return (
        <>
          {arm}
          <LightPass color="#9fc2f0" opacity={0.18} cx={1010} cy={540} rx={140} ry={60} blend="screen">
            {arm}
          </LightPass>
        </>
      );
    })()}
    {/* rolled cuff at the far elbow, catching lamp light */}
    <path d="M 760 580 C 776 574 796 576 808 586 L 810 620 C 794 628 772 628 760 620 Z" fill="#8e9ab0" />
    <Soft d="M 790 578 L 812 584 L 812 622 L 792 624 Z" fill={C.lamp} o={0.35} blur={4} blend="screen" />
  </g>
);
