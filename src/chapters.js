export const CHAPTERS = [
  {
    id: '01-childhood', age: '童年', english: 'CHILDHOOD', title: '床下之眼', boss: '床下巨人',
    fear: '怕黑 · 被注视', color: '#ff6ab5', tint: '#320b27', side: 'left', relativeZ: -18,
    line: '你关了灯，房间却睁开了眼睛。',
    scene: '床栏高得像围墙，半开的门投下一线暖光。两只嵌在墙里的眼睛，正看向床边那盏小夜灯。',
    encounter: '前伸的巨手预告抓取方向。观察肩膀和手掌的变化，抓住巨手收回后的空隙。',
    enemies: '单个巨人',
    items: [
      ['小夜灯', '短暂照亮附近的暗处。'],
      ['凝视盾', '以眼形盾面挡下正面的扑击。'],
      ['梦裂短刃', '在巨手收回后贴近反击。'],
    ],
  },
  {
    id: '02-adolescence', age: '青春期', english: 'ADOLESCENCE', title: '镜中审判', boss: '失真倒影',
    fear: '被评价 · 不合群', color: '#e0ef74', tint: '#260c37', side: 'right', relativeZ: -32,
    line: '你停在镜前。它还在往前走。',
    scene: '成排的储物柜尽头立着一面旧哈哈镜。你站直时，镜中人却歪着头。',
    encounter: '镜中的人形会迟一步模仿你的动作。靠近时，它会从凹陷的镜面里扑出。',
    enemies: '失真倒影 + 镜影',
    artFiles: { scene: 'hall-v2', encounter: 'reflection-v2', mirror: 'mirror-v2', jumpscare: 'jumpscare-v3' },
    items: [
      ['裂面手镜', '短暂暴露镜影的来向。'],
      ['空白校牌', '打开一扇没有标记的柜门。'],
      ['打结耳机', '压低杂音，凸显镜面碎裂的提示声。'],
    ],
  },
  {
    id: '03-adulthood', age: '成年', english: 'ADULTHOOD', title: '永不下班', boss: '蚀时蛾',
    fear: '期限 · 失去掌控', color: '#ff9b52', tint: '#39160d', side: 'left', relativeZ: -48,
    line: '下班铃响过了。窗外的落日还缺着一角。',
    scene: '深夜的档案室被成排柜体围住，空白纸页悬在顶上。最远的一盏台灯还亮着。',
    encounter: '一侧翅膀留下金色圆环，另一侧只剩一弯细弧。蚀时蛾迎面展开双翼，弯曲的双尾垂在暮色里。',
    enemies: '蚀时蛾 + 折纸鸟',
    artFiles: { encounter: 'eclipse-moth-frontal' },
    items: [
      ['停针表', '短暂放慢摆锤的节奏。'],
      ['延时印章', '为下一次横扫争取一点间隔。'],
      ['清单剪', '剪开阻挡通道的纸带。'],
    ],
  },
  {
    id: '04-old-age', age: '老年', english: 'OLD AGE', title: '褪色的家', boss: '回声守门人',
    fear: '记忆褪色 · 熟悉之地变陌生', color: '#e8bfd8', tint: '#2d1a2e', side: 'right', relativeZ: -62,
    line: '你认得这把椅子，却记不起它在哪一间屋。',
    scene: '同一把扶手椅、同一盏灯和一排空相框在走廊里重复。每扇暖色的门后，都像是同一个家。',
    encounter: '空相框游荡在门之间。回声守门人会重现前几关的攻击节奏，门的位置也会随遭遇变化。',
    enemies: '回声守门人 + 空相框 + 前关回声',
    items: [
      ['空白相框', '标记一扇已经确认过的门。'],
      ['回声录音带', '重放上一段走廊的声音。'],
      ['归路线轴', '为回头时留下一段可辨认的线。'],
    ],
  },
];

export function art(chapter, kind) {
  return import.meta.env.BASE_URL + 'assets/' + chapter.id + '/' + (chapter.artFiles?.[kind] ?? kind) + '.webp';
}
