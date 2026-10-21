import React from 'react';
import {C, Soft} from './Room';

import {HandSideTap, HandPalette} from '../characters/Hands';
import {LightPass} from '../art/LightPass';

/** Style test: god Varun seated in profile, anime line art + cel shading, Klaus-style light. */

const LINE = '#3a1d12';
const SKIN = '#d29468';
const SKIN_SH = '#9a5a3c';
const HAIR = '#1f1714';
const HAIR_SH = '#0d0908';

const HEAD =
  'M -40 40 C -64 10 -66 -56 -36 -86 C -10 -110 36 -108 58 -84 C 68 -72 72 -54 72 -38 C 72 -30 74 -24 72 -18 ' +
  'C 70 -12 72 -6 76 2 C 80 10 84 16 84 20 C 82 24 78 26 74 26 C 74 30 76 34 76 38 C 75 42 72 44 72 46 ' +
  'C 74 50 72 54 68 56 C 66 62 66 70 60 78 C 52 86 36 86 22 80 C 8 72 -4 62 -12 52 C -22 46 -32 44 -40 40 Z';
const NECK = 'M 16 76 C 22 96 26 120 30 160 L -34 160 C -32 120 -34 76 -40 40 C -26 58 -6 70 16 76 Z';
const HAIR_PATH =
  'M 66 -70 C 76 -60 80 -48 78 -38 L 68 -50 L 64 -36 L 56 -52 L 48 -38 L 42 -56 C 30 -50 20 -40 14 -28 L 12 -4 L 4 -6 ' +
  'L 2 -24 C -8 -30 -18 -28 -26 -20 C -34 -6 -40 14 -46 32 L -56 24 L -60 40 L -68 16 C -82 -12 -82 -62 -58 -94 ' +
  'C -34 -126 20 -130 50 -112 C 68 -100 74 -84 66 -70 Z';

const Head: React.FC = () => (
  <g strokeLinejoin="round">
    <defs>
      <clipPath id="asHeadClip">
        <path d={HEAD} />
        <path d={NECK} />
      </clipPath>
      <clipPath id="asHairClip">
        <path d={HAIR_PATH} />
      </clipPath>
    </defs>
    <path d={NECK} fill={SKIN} />
    <path d={HEAD} fill={SKIN} />
    <g clipPath="url(#asHeadClip)">
      {/* hard cel shadow: back of the head, jaw and neck */}
      <path d="M -80 -120 L 24 -120 C 20 -60 14 0 30 40 C 40 60 50 70 60 80 L 60 200 L -80 200 Z" fill={SKIN_SH} />
      <path d="M 20 80 C 40 86 56 84 70 76 L 70 120 L 20 120 Z" fill="#7a4029" />
      {/* cool screen light softly on the front of the face */}
      <Soft d="M 50 -90 C 80 -60 100 0 92 60 C 84 86 70 94 54 90 C 60 50 50 0 40 -40 Z" fill="#a9c3ee" o={0.4} blur={10} blend="screen" />
      <path d="M 58 -84 C 68 -72 72 -54 72 -38 C 72 -30 74 -24 72 -18 C 70 -12 72 -6 76 2 C 80 10 84 16 84 20" stroke="#e4eeff" strokeWidth={5} fill="none" opacity={0.6} filter="url(#stBlur2)" />
      <path d="M -40 40 C -34 76 -32 120 -36 160" stroke="#8fb0e0" strokeWidth={6} fill="none" opacity={0.5} filter="url(#stBlur2)" />
    </g>
    <path d={HEAD} fill="none" stroke={LINE} strokeWidth={2.2} />
    <path d="M 16 76 C 22 96 26 120 30 160 M -40 40 C -34 76 -32 120 -34 160" fill="none" stroke={LINE} strokeWidth={2.2} />
    {/* ear */}
    <path d="M -12 -20 C 4 -26 12 -10 10 6 C 8 20 0 26 -10 22 C -18 18 -24 -14 -12 -20 Z" fill={SKIN_SH} stroke={LINE} strokeWidth={2} />
    <path d="M -6 -12 C 4 -10 5 2 2 10" stroke="#5a2a18" strokeWidth={2} fill="none" strokeLinecap="round" />
    {/* eye: anime profile wedge, looking down at the screen */}
    <path d="M 52 -14 L 66 -12 L 64 -2 C 58 -2 54 -6 52 -14 Z" fill="#f4ece2" />
    <ellipse cx={61} cy={-6} rx={3.6} ry={6} fill="#2a140c" />
    <circle cx={62.4} cy={-8.5} r={1.4} fill="#fff" />
    <path d="M 49 -16 Q 58 -18 68 -12 L 71 -10" stroke="#1a0d08" strokeWidth={3.6} fill="none" strokeLinecap="round" />
    <path d="M 54 -1 L 62 -1" stroke={LINE} strokeWidth={1.4} />
    <path d="M 48 -28 Q 58 -33 70 -28" stroke="#2a1610" strokeWidth={3.2} fill="none" strokeLinecap="round" />
    {/* mouth */}
    <path d="M 72 46 L 64 46" stroke={LINE} strokeWidth={1.8} strokeLinecap="round" />
    {/* blush */}
    <Soft d="M 40 18 C 50 14 62 18 64 26 C 56 32 44 30 40 18 Z" fill="#e2604a" o={0.3} blur={4} />
    {/* hair */}
    <path d={HAIR_PATH} fill={HAIR} />
    <g clipPath="url(#asHairClip)">
      <path d="M -100 -140 L -30 -140 C -40 -80 -40 -20 -20 40 L -100 40 Z" fill={HAIR_SH} />
      <path d="M -30 -110 C 0 -120 30 -118 52 -104 L 46 -96 C 28 -106 2 -108 -24 -102 Z" fill="#5b4c58" />
      <path d="M 20 -130 C 60 -120 82 -90 80 -50" stroke="#6a86bc" strokeWidth={6} fill="none" opacity={0.55} filter="url(#stBlur2)" />
    </g>
    <path d={HAIR_PATH} fill="none" stroke="#0a0605" strokeWidth={2.2} />
    <path d="M 14 -116 C 24 -126 36 -130 44 -126" stroke={HAIR} strokeWidth={3} fill="none" strokeLinecap="round" />
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

const SHIRT = '#b9c2d2';
const SHIRT_DEEP = '#5d6882';

const HAND_PAL: HandPalette = {skin: '#c4824f', shade: '#6e3a1e', deep: '#4a2412', nail: '#e2b08e', crease: '#5a2a14'};

export const AnimeSeated: React.FC<{lift?: number}> = ({lift = 0}) => (
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
    <path d={TROUSERS} fill="#2a2f3a" stroke={LINE} strokeWidth={2.4} />
    <path d={SHIN} fill="#191b21" />
    <g clipPath="url(#stTrouserClip)">
      <Soft d="M 600 820 L 980 820 L 980 860 L 600 860 Z" fill="#000" o={0.6} blur={10} />
      <Soft d="M 640 742 C 760 748 880 758 950 772 L 950 790 C 860 780 740 770 640 762 Z" fill="#5b6a86" o={0.4} blur={6} blend="screen" />
      <path d="M 660 800 C 740 806 820 812 900 816" stroke="#0c0d10" strokeWidth={4} fill="none" opacity={0.7} filter="url(#stBlur2)" />
    </g>
    <path d="M 906 866 L 968 862 C 990 862 1000 874 996 880 L 904 880 Z" fill="#0b0a09" />
    <path d="M 920 864 L 966 862" stroke="#6a7fa0" strokeWidth={1.5} opacity={0.5} />

    {/* far arm: upper arm reaching toward the desk, mostly behind the torso */}
    <path d={FAR_UPPER} fill={SHIRT_DEEP} stroke={LINE} strokeWidth={2.2} />
    <path d="M 750 584 C 768 578 790 582 804 592 L 806 614 C 790 624 768 626 752 618 Z" fill="#59647a" />

    {/* head, slouched forward and tilted down toward the screen (drawn before the shirt so the collar sits over the neck) */}
    <g transform="translate(736 352) rotate(11) scale(0.94)">
      <Head />
    </g>

    {/* torso */}
    <path d={TORSO} fill={SHIRT} />
    <g clipPath="url(#stTorsoClip)">
      <path d="M 560 400 L 684 400 C 664 520 664 640 694 800 L 560 800 Z" fill={SHIRT_DEEP} />
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
    <path d={TORSO} fill="none" stroke={LINE} strokeWidth={2.4} />

    {/* open collar */}
    <path d="M 670 424 C 684 440 706 448 730 444 L 734 460 C 710 466 684 460 664 444 Z" fill="#e2e7ef" stroke={LINE} strokeWidth={2} />
    <path d="M 722 442 C 734 454 746 468 754 484 L 746 488 C 736 474 724 460 714 448 Z" fill="#5d6a80" />
    <path d="M 726 444 C 734 452 740 460 746 470" stroke="#e4eeff" strokeWidth={1.4} opacity={0.5} />

    {/* near arm resting on the thigh; it shadows the torso behind it */}
    <Soft d="M 640 460 C 690 450 730 470 734 500 L 730 650 L 660 660 Z" fill="#0b0f18" o={0.45} blur={10} />
    <path d={UPPER_NEAR} fill="#9aa4b8" />
    <g clipPath="url(#stNearArmClip)">
      <Soft d="M 630 440 L 670 440 C 666 520 668 580 676 650 L 630 650 Z" fill={SHIRT_DEEP} o={0.85} blur={10} />
      <Soft d="M 712 450 C 730 520 726 590 716 650 L 700 650 C 708 580 708 520 700 450 Z" fill="#c9d8f0" o={0.4} blur={6} blend="screen" />
      <path d="M 652 452 C 646 470 646 500 648 504 L 656 634" stroke="#8fb0e0" strokeWidth={4} fill="none" opacity={0.5} filter="url(#stBlur2)" />
      <path d="M 660 520 C 676 530 696 530 712 520" stroke={SHIRT_DEEP} strokeWidth={4} fill="none" opacity={0.5} filter="url(#stBlur2)" />
    </g>
    <path d={UPPER_NEAR} fill="none" stroke={LINE} strokeWidth={2.4} />
    {/* rolled cuff */}
    <path d="M 650 610 C 666 602 700 602 716 610 L 718 642 C 702 652 666 652 650 642 Z" fill="#c9d0de" stroke={LINE} strokeWidth={2.2} />
    <path d="M 652 626 C 668 620 698 620 716 626" stroke={SHIRT_DEEP} strokeWidth={2} fill="none" />
    <path d="M 650 642 C 666 652 702 652 718 642" stroke="#000" strokeWidth={3} fill="none" opacity={0.3} />
    {/* forearm + hand on thigh, in the shadow under the desk */}
    <path d={FOREARM_NEAR} fill="#7a4229" stroke={LINE} strokeWidth={2.2} />
    <path d={HAND_NEAR} fill="#7a4229" stroke={LINE} strokeWidth={2.2} />
    <path d="M 850 740 C 858 748 860 756 854 762" stroke="#2e170c" strokeWidth={2} fill="none" />
    <path d="M 838 744 C 848 754 848 762 842 766" stroke="#2e170c" strokeWidth={2} fill="none" />
    <path d="M 716 640 L 816 724" stroke="#b9cbea" strokeWidth={2} opacity={0.35} />

    {/* far forearm and the tapping hand, in the lamp light */}
    {(() => {
      const arm = (
        <g>
          <path d={FAR_FOREARM} fill={HAND_PAL.skin} stroke={LINE} strokeWidth={2} />
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
    <path d="M 760 580 C 776 574 796 576 808 586 L 810 620 C 794 628 772 628 760 620 Z" fill="#c9d0de" stroke={LINE} strokeWidth={2.2} />
    <Soft d="M 790 578 L 812 584 L 812 622 L 792 624 Z" fill={C.lamp} o={0.35} blur={4} blend="screen" />
  </g>
);
