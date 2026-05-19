/**
 * General Assembly / event photos on Cloudinary (f_auto,q_auto,w_1920).
 * Single source of truth for dashboard + public Community page.
 */

/** Landing page coop intro video (hosted on Cloudinary — not in git). */
export const LANDING_VIDEO_URL =
  'https://res.cloudinary.com/doas4qcdo/video/upload/v1779174578/FINAL_COOP_w4uxr2.mp4';

export const GALLERY_IMAGE_URLS: readonly string[] = [
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779084645/2_pjbzf9.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085494/4_zculus.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085487/5_tca5pb.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085487/6_bixmec.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085537/10_mcggnq.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085538/11_wjmjvr.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085544/13_wqvlhp.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085536/15_ovicxz.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085548/18_vcti4g.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085535/19_xxol9o.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085533/22_rym3vy.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085531/24_kl92gp.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085531/25_yhyokv.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085541/30_euwsfx.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779085532/34_u0yslm.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086676/36_if7ehu.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086813/39_xnnpkt.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086814/42_pl2mjw.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086808/44_tc1ygx.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086813/47_wjxp4q.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086811/51_bbh7kp.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086810/59_bjaav3.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086813/62_sdzviq.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086809/65_xkfv4x.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086807/68_p0s8vx.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086811/73_ftlzds.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086809/76_b8snmf.png',
  'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1920/v1779086816/78_jvj66z.png',
];

/** Indices in GALLERY_IMAGE_URLS: 2=5.png, 1=4.png, 11=24.png, 16=39.png */
const COMMUNITY_GA_INDICES = [2, 1, 11, 16] as const;

/** Public Community page — 11th GA carousel (matches original local asset order) */
export const COMMUNITY_GA_GALLERY_URLS: readonly string[] = COMMUNITY_GA_INDICES.map(
  (i) => GALLERY_IMAGE_URLS[i]
);
