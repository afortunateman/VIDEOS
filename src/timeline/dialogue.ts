import type {SceneId} from './timeline';

export type Speaker = 'Narrator' | 'Varun' | 'Father' | 'Mother' | 'Elias' | 'Crowd';

export type DialogueLine = {
  id: string;
  scene: SceneId;
  speaker: Speaker;
  /** Scene-relative seconds. */
  start: number;
  /** Rough spoken length in seconds (used for subtitles until real audio exists). */
  estDuration: number;
  text: string;
  direction?: string;
};

// Voice files live at public/audio/voice/<id>.mp3 and are swappable.
export const DIALOGUE: DialogueLine[] = [
  {id: 'C0_01', scene: 'C0', speaker: 'Narrator', start: 1.0, estDuration: 14.0, direction: 'slow, solemn',
    text: 'The Hand delivers judgement. The Great Inversion. The end of winter. Those who repent ascend the fingers to the palm. The unworthy face the wrath of the hand, and perish. The palm, with its valleys and rivers, is the promised land. Warm. Full of life.'},

  {id: 'S2_01', scene: 'S2', speaker: 'Elias', start: 9.0, estDuration: 1.6, direction: 'tired', text: 'Dude, not this again.'},
  {id: 'S2_02', scene: 'S2', speaker: 'Varun', start: 11.0, estDuration: 2.2, text: "You know I can't do this, right?"},
  {id: 'S2_03', scene: 'S2', speaker: 'Mother', start: 14.0, estDuration: 1.4, direction: 'sighing', text: 'Varun...'},
  {id: 'S2_04', scene: 'S2', speaker: 'Varun', start: 16.0, estDuration: 2.2, text: 'Then why do we keep having it?'},
  {id: 'S2_05', scene: 'S2', speaker: 'Father', start: 19.5, estDuration: 11.5, direction: 'voice significantly raised',
    text: "I don't care what they teach you down at that university. You can call yourself a man of science. You can write your papers. I'm fine with all of that. But in this house, you show respect."},
  {id: 'S2_06', scene: 'S2', speaker: 'Varun', start: 32.0, estDuration: 1.2, text: 'By pretending?'},
  {id: 'S2_07', scene: 'S2', speaker: 'Father', start: 36.0, estDuration: 2.8, text: 'By following the customs of this family.'},
  {id: 'S2_08', scene: 'S2', speaker: 'Varun', start: 39.5, estDuration: 1.8, text: "Even if they're wrong?"},
  {id: 'S2_09', scene: 'S2', speaker: 'Mother', start: 45.0, estDuration: 0.9, direction: 'whispering', text: 'Joseph.'},
  {id: 'S2_10', scene: 'S2', speaker: 'Father', start: 47.0, estDuration: 8.0, direction: 'cold, immovable',
    text: 'As long as you sit at this table. My table. In my house. And eat my food. You will do as you\'re told.'},
  {id: 'S2_11', scene: 'S2', speaker: 'Mother', start: 62.0, estDuration: 1.0, direction: 'off-screen', text: 'Varun!'},

  {id: 'S3_01', scene: 'S3', speaker: 'Varun', start: 0.5, estDuration: 4.5, direction: 'voice-over',
    text: 'You could say I never really understood the concept of a god.'},

  {id: 'S4_01', scene: 'S4', speaker: 'Elias', start: 7.0, estDuration: 13.0,
    text: "Varun, stop. Think about it for a second. The Maker. They sculpted us from divine clay. And you ask why a hand? Because it's the ultimate tool of creation!"},
  {id: 'S4_02', scene: 'S4', speaker: 'Elias', start: 21.0, estDuration: 7.0,
    text: 'They gave us an image of themselves, right at the end of our own arms, to remind us of our divine origins.'},
  {id: 'S4_03', scene: 'S4', speaker: 'Elias', start: 30.0, estDuration: 11.0,
    text: 'They are a reminder of your purpose! To build. To grasp. To hold on when the cold finally breaks. Because Winter doesn\'t last forever, Varun. You know what comes next!'},
  {id: 'S4_04', scene: 'S4', speaker: 'Varun', start: 43.0, estDuration: 7.0,
    text: "Right. The Great Inversion. The sky magically flips upside down because I didn't say grace at the dinner table."},
  {id: 'S4_05', scene: 'S4', speaker: 'Elias', start: 50.5, estDuration: 11.0,
    text: "It's Judgment! When the Hand turns, you think you can just stand your ground? When the world turns upside down, the sinners will perish. And if you don't wanna fall with them, I suggest you pray and ascend to the heavens along with the rest of us."},
  {id: 'S4_06', scene: 'S4', speaker: 'Varun', start: 62.0, estDuration: 7.0,
    text: "Heavens? The promised land. The land where it's always warm and full of life. With its valleys and rivers."},
  {id: 'S4_07', scene: 'S4', speaker: 'Elias', start: 69.5, estDuration: 1.0, direction: 'desperate, hopeful', text: 'Yes!'},
  {id: 'S4_08', scene: 'S4', speaker: 'Varun', start: 79.0, estDuration: 20.0, direction: 'projecting',
    text: "My dear townsfolk! My dear friend Elias here, like a lot of you, believes that if you repent for your sins and say grace before dinner every night, you'll get to go to heaven. Well, let me ask you a simple question. Has any of you ever seen the Hand? Has anyone got any proof that the Great Inversion actually exists?"},
  {id: 'S4_09', scene: 'S4', speaker: 'Varun', start: 103.0, estDuration: 17.0,
    text: "Sure, the old ones said so. It's in our scriptures. But they also said the booms we hear from the sky are the voice of God giving us divine revelations! Didn't our scientists prove that's just the sounds of the universe? How it interacts with our atmosphere?"},
  {id: 'S4_10', scene: 'S4', speaker: 'Varun', start: 121.0, estDuration: 27.0, direction: 'speed and volume climb',
    text: "God is just a natural phenomenon we have yet to explain. Like night and day. Think about it! This doesn't make any sense. This is stupid! Why is there an almighty Hand judging us in the first place? And let's be logical: if there is a supreme creator, why would it be a hand? How is a palm watching us? Are there eyes in the fingertips? Wouldn't a face make more sense? Hell, why a hand and not a giant Foot?!"},

  {id: 'S5_01', scene: 'S5', speaker: 'Father', start: 3.0, estDuration: 3.2, direction: 'from inside, muffled',
    text: "Don't you dare show your face in this house again."},
  {id: 'S5_02', scene: 'S5', speaker: 'Varun', start: 19.0, estDuration: 1.6, direction: 'whisper, trembling', text: "It's a scam."},
  {id: 'S5_03', scene: 'S5', speaker: 'Varun', start: 22.0, estDuration: 7.0, direction: 'whisper',
    text: 'I swear... I will make the world see that there is nothing but us out there.'},

  {id: 'S6_01', scene: 'S6', speaker: 'Varun', start: 11.0, estDuration: 2.4, text: "Yeah, Dad. I'm still at the desk."},
  {id: 'S6_02', scene: 'S6', speaker: 'Varun', start: 16.0, estDuration: 7.0,
    text: "I know, boss. I'm just finishing up the appeals. I'll leave the folders on your desk before I head out."},
  {id: 'S6_03', scene: 'S6', speaker: 'Crowd', start: 26.5, estDuration: 3.0, text: "It's the Great Inversion. It's happening!"},
  {id: 'S6_04', scene: 'S6', speaker: 'Crowd', start: 44.0, estDuration: 4.0, text: 'We are saved. We are ascending. / It has begun.'},
  {id: 'S6_05', scene: 'S6', speaker: 'Varun', start: 49.5, estDuration: 4.5, text: "Yes, yes, I'm coming for dinner soon. I'll lock up on my way out."},
  {id: 'S6_06', scene: 'S6', speaker: 'Varun', start: 57.0, estDuration: 1.4, text: 'See you in twenty.'},
];

export const linesForScene = (scene: SceneId) => DIALOGUE.filter((l) => l.scene === scene);
