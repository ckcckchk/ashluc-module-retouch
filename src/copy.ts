/**
 * The panel's words, in the three languages the studio ships.
 *
 * Labels are the beauty-app terms a person already knows (瘦臉 / Teeth), two to three characters,
 * because they render as tab rows, chip rows and slider labels in a 336 px column.
 */
import type { GroupId, LipShade, PresetId, SliderId } from './types';

export type Locale = 'en' | 'zh-HK' | 'zh-CN';

export interface Copy {
  title: string;
  lead: string;
  tabs: Record<GroupId, string>;
  sliders: Record<SliderId, string>;
  presets: Record<PresetId, string>;
  presetLabel: string;
  shadesLabel: string;
  shades: Record<LipShade, string>;
  compare: string;
  compareHint: string;
  rotate: string;
  flip: string;
  reset: string;
  restore: string;
  apply: string;
  applying: string;
  applied: string;
  neutral: string;
  hint: string;
  heal: { toggle: string; size: string; undo: string; clear: string; hint: string };
  detect: { searching: string; none: string; failed: string; retry: string };
  needFace: string;
  failed: string;
  needSource: string;
}

export const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Retouch',
    lead: 'Shape, skin, makeup and blemish repair — every pass runs on this device.',
    tabs: {
      shape: 'Shape',
      eyes: 'Eyes',
      nose: 'Nose',
      mouth: 'Mouth',
      skin: 'Skin',
      makeup: 'Makeup',
      local: 'Local',
    },
    sliders: {
      slim: 'Slim',
      vshape: 'Chin',
      forehead: 'Forehead',
      cheek: 'Cheekbone',
      facelength: 'Face length',
      eyesize: 'Eyes',
      eyespace: 'Eye space',
      eyetilt: 'Eye tilt',
      eyeopen: 'Eye height',
      nosewidth: 'Nose width',
      noselength: 'Nose length',
      nosetip: 'Nose tip',
      mouthwidth: 'Mouth width',
      lipfull: 'Lip fullness',
      smile: 'Smile',
      smooth: 'Smooth',
      whiten: 'Whiten',
      eventone: 'Even tone',
      blush: 'Blush',
      lipcolor: 'Lip colour',
      brow: 'Brow',
      eyeshadow: 'Eyeshadow',
      contour: 'Contour',
      eyebright: 'Brighten',
      eyebag: 'Eye bags',
      teeth: 'Teeth',
    },
    presets: { natural: 'Natural', refined: 'Refined', glam: 'Glam', fresh: 'Fresh', male: 'Male' },
    presetLabel: 'Look',
    shadesLabel: 'Lip shade',
    shades: { rose: 'Rose', coral: 'Coral', plum: 'Plum', nude: 'Nude' },
    compare: 'Compare',
    compareHint: 'Hold to see the original',
    rotate: 'Rotate',
    flip: 'Mirror',
    reset: 'Reset',
    restore: 'Restore',
    apply: 'Apply',
    applying: 'Applying…',
    applied: 'Applied',
    neutral: 'Neutral',
    hint: 'Drag a control to tune it; hold Compare for the original.',
    heal: {
      toggle: 'Heal',
      size: 'Brush',
      undo: 'Undo',
      clear: 'Clear',
      hint: 'Brush over a blemish to lift it.',
    },
    detect: {
      searching: 'Finding the face…',
      none: 'No face detected — heal and apply still work.',
      failed: 'Face detection did not load.',
      retry: 'Try again',
    },
    needFace: 'No face in this photo, so shape, skin and makeup stay off. Heal and Apply still work.',
    failed: 'The frame could not be retouched. Try again.',
    needSource: 'Choose a photo to retouch.',
  },

  'zh-HK': {
    title: '人像美容',
    lead: '調整輪廓、膚質與妝容，並修復細小瑕疵；所有處理均在本機完成。',
    tabs: {
      shape: '形體',
      eyes: '眼睛',
      nose: '鼻子',
      mouth: '嘴巴',
      skin: '皮膚',
      makeup: '妝容',
      local: '局部',
    },
    sliders: {
      slim: '瘦臉',
      vshape: '尖下巴',
      forehead: '額頭',
      cheek: '顴骨',
      facelength: '臉長',
      eyesize: '大眼',
      eyespace: '眼距',
      eyetilt: '眼尾',
      eyeopen: '眼高',
      nosewidth: '鼻翼',
      noselength: '鼻長',
      nosetip: '鼻頭',
      mouthwidth: '嘴寬',
      lipfull: '唇厚',
      smile: '嘴角',
      smooth: '磨皮',
      whiten: '美白',
      eventone: '勻膚',
      blush: '腮紅',
      lipcolor: '唇彩',
      brow: '眉',
      eyeshadow: '眼影',
      contour: '修容',
      eyebright: '亮眼',
      eyebag: '去眼袋',
      teeth: '牙齒',
    },
    presets: { natural: '自然', refined: '精緻', glam: '網紅', fresh: '清新', male: '男神' },
    presetLabel: '風格',
    shadesLabel: '唇色',
    shades: { rose: '玫瑰', coral: '珊瑚', plum: '梅子', nude: '裸色' },
    compare: '對比',
    compareHint: '按住以查看原圖',
    rotate: '旋轉',
    flip: '鏡像',
    reset: '重設',
    restore: '還原',
    apply: '套用',
    applying: '套用中…',
    applied: '已套用',
    neutral: '歸零',
    hint: '左右拖動即可調整；按住「對比」可查看原圖。',
    heal: {
      toggle: '修瑕疵',
      size: '筆刷大小',
      undo: '復原',
      clear: '清除',
      hint: '在瑕疵上輕輕塗抹即可去除。',
    },
    detect: {
      searching: '正在定位臉部…',
      none: '未能偵測臉部，仍可修瑕疵及套用。',
      failed: '臉部偵測未能載入。',
      retry: '重試',
    },
    needFace: '這張相片沒有臉部，形體、膚質與妝容暫不可用；修瑕疵與套用仍可正常使用。',
    failed: '未能完成修圖，請再試一次。',
    needSource: '請先選擇一張相片。',
  },

  'zh-CN': {
    title: '人像美容',
    lead: '调整轮廓、肤质与妆容，并修复细小瑕疵；所有处理均在本机完成。',
    tabs: {
      shape: '形体',
      eyes: '眼睛',
      nose: '鼻子',
      mouth: '嘴巴',
      skin: '皮肤',
      makeup: '妆容',
      local: '局部',
    },
    sliders: {
      slim: '瘦脸',
      vshape: '尖下巴',
      forehead: '额头',
      cheek: '颧骨',
      facelength: '脸长',
      eyesize: '大眼',
      eyespace: '眼距',
      eyetilt: '眼尾',
      eyeopen: '眼高',
      nosewidth: '鼻翼',
      noselength: '鼻长',
      nosetip: '鼻头',
      mouthwidth: '嘴宽',
      lipfull: '唇厚',
      smile: '嘴角',
      smooth: '磨皮',
      whiten: '美白',
      eventone: '匀肤',
      blush: '腮红',
      lipcolor: '唇彩',
      brow: '眉',
      eyeshadow: '眼影',
      contour: '修容',
      eyebright: '亮眼',
      eyebag: '去眼袋',
      teeth: '牙齿',
    },
    presets: { natural: '自然', refined: '精致', glam: '网红', fresh: '清新', male: '男神' },
    presetLabel: '风格',
    shadesLabel: '唇色',
    shades: { rose: '玫瑰', coral: '珊瑚', plum: '梅子', nude: '裸色' },
    compare: '对比',
    compareHint: '按住以查看原图',
    rotate: '旋转',
    flip: '镜像',
    reset: '重置',
    restore: '还原',
    apply: '应用',
    applying: '正在应用…',
    applied: '已应用',
    neutral: '归零',
    hint: '左右拖动即可调整；按住“对比”可查看原图。',
    heal: {
      toggle: '修瑕疵',
      size: '笔刷大小',
      undo: '撤销',
      clear: '清除',
      hint: '在瑕疵上轻轻涂抹即可去除。',
    },
    detect: {
      searching: '正在定位脸部…',
      none: '未检测到人脸，仍可修瑕疵及应用。',
      failed: '人脸检测加载失败。',
      retry: '重试',
    },
    needFace: '这张照片没有人脸，形体、肤质与妆容暂不可用；修瑕疵与应用仍可正常使用。',
    failed: '未能完成修图，请重试。',
    needSource: '请先选择一张照片。',
  },
};
