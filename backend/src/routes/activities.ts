import express, { Request, Response } from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to verify user ID
const verifyUser = (req: Request, res: Response, next: Function) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  (req as any).userId = userId;
  next();
};

// Middleware to verify admin/staff role
const verifyAdminOrStaff = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).userId;
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = result.rows[0].role;
    if (userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ error: 'Access denied. Admin or staff role required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user role' });
  }
};

let activitiesTableEnsured = false;
let activitiesEnsuringPromise: Promise<void> | null = null;

// Ensure table exists & seed default 11th General Assembly activity (cached)
const ensureActivitiesTable = async () => {
  if (activitiesTableEnsured) return;
  if (activitiesEnsuringPromise) return activitiesEnsuringPromise;

  activitiesEnsuringPromise = (async () => {
    try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recent_activities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        date TEXT,
        time TEXT,
        short_description TEXT,
        full_description TEXT,
        photographers JSONB DEFAULT '[]'::jsonb,
        editor TEXT,
        gallery_images JSONB DEFAULT '[]'::jsonb,
        color_theme TEXT DEFAULT 'emerald',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE recent_activities ADD COLUMN IF NOT EXISTS color_theme TEXT DEFAULT 'emerald';
      ALTER TABLE recent_activities ALTER COLUMN title TYPE TEXT;
      ALTER TABLE recent_activities ALTER COLUMN subtitle TYPE TEXT;
      ALTER TABLE recent_activities ALTER COLUMN date TYPE TEXT;
      ALTER TABLE recent_activities ALTER COLUMN time TYPE TEXT;
      ALTER TABLE recent_activities ALTER COLUMN editor TYPE TEXT;
      ALTER TABLE recent_activities ALTER COLUMN color_theme TYPE TEXT;
    `);

    const defaultGaPhotos = [
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779084645/2_pjbzf9.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085494/4_zculus.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085487/5_tca5pb.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085487/6_bixmec.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085537/10_mcggnq.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085538/11_wjmjvr.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085544/13_wqvlhp.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085536/15_ovicxz.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085548/18_vcti4g.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085535/19_xxol9o.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085533/22_rym3vy.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085531/24_kl92gp.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085531/25_yhyokv.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085541/30_euwsfx.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779085532/34_u0yslm.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086676/36_if7ehu.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086813/39_xnnpkt.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086814/42_pl2mjw.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086808/44_tc1ygx.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086813/47_wjxp4q.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086811/51_bbh7kp.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086810/59_bjaav3.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086813/62_sdzviq.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086809/65_xkfv4x.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086807/68_p0s8vx.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086811/73_ftlzds.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086809/76_b8snmf.png',
      'https://res.cloudinary.com/doas4qcdo/image/upload/f_auto,q_auto,w_1200/v1779086816/78_jvj66z.png'
    ];

    // Check if table is empty
    const checkResult = await pool.query('SELECT COUNT(*) FROM recent_activities');
    if (parseInt(checkResult.rows[0].count, 10) === 0) {
      await pool.query(
        `INSERT INTO recent_activities (
          id, title, subtitle, date, time, short_description, full_description, photographers, editor, gallery_images, color_theme, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )`,
        [
          'act-default-1',
          '11TH GENERAL ASSEMBLY 2026',
          "Shaping Our Cooperative's Future Together",
          'March 21, 2026',
          '1:00 PM - 5:00 PM',
          'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare.',
          'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative\'s strategic direction for the upcoming year.\n\nKey highlights included the approval of new sustainability initiatives, the introduction of enhanced member benefits, and the unanimous election of the new board of directors. The assembly also featured presentations on financial performance, showcasing the cooperative\'s growth and stability. Members actively participated in workshops focused on cooperative principles, community engagement, and future development plans. The event concluded with a commitment to transparency, member empowerment, and continued excellence in serving the UC METC community.',
          JSON.stringify(['Vince Andrew Santoya', 'Kisses Peñera']),
          'Vince Andrew Santoya',
          JSON.stringify(defaultGaPhotos),
          'emerald'
        ]
      );
    } else {
      // Auto-update existing default activity if it holds outdated Cloudinary URLs
      await pool.query(
        `UPDATE recent_activities 
         SET gallery_images = $1 
         WHERE gallery_images::text LIKE '%dph4hxexg%' OR id = 'act-default-1'`,
        [JSON.stringify(defaultGaPhotos)]
      );
      activitiesTableEnsured = true;
    }
  } catch (error) {
    console.error('Failed to ensure recent_activities table:', error);
  } finally {
    activitiesEnsuringPromise = null;
  }
})();

  return activitiesEnsuringPromise;
};

// Get public activities
router.get('/public', async (req: Request, res: Response) => {
  try {
    await ensureActivitiesTable();
    const result = await pool.query('SELECT * FROM recent_activities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get admin activities
router.get('/', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    await ensureActivitiesTable();
    const result = await pool.query('SELECT * FROM recent_activities ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Create activity
router.post('/', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    await ensureActivitiesTable();
    const { title, subtitle, date, time, shortDescription, fullDescription, photographers, editor, galleryImages, colorTheme, color_theme } = req.body;
    
    if (!title || !shortDescription) {
      return res.status(400).json({ error: 'Title and short description are required' });
    }

    const theme = colorTheme || color_theme || 'emerald';
    const id = `act-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO recent_activities (
        id, title, subtitle, date, time, short_description, full_description, photographers, editor, gallery_images, color_theme, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *`,
      [
        id,
        title,
        subtitle || '',
        date || '',
        time || '',
        shortDescription,
        fullDescription || shortDescription,
        JSON.stringify(Array.isArray(photographers) ? photographers : (photographers || '').split(',').map((s: string) => s.trim()).filter(Boolean)),
        Array.isArray(editor) ? editor.join(', ') : (editor || '').trim(),
        JSON.stringify(Array.isArray(galleryImages) ? galleryImages : []),
        theme
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to create activity:', error);
    res.status(500).json({ error: error?.message || 'Failed to create activity' });
  }
});

// Update activity
router.put('/:id', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, subtitle, date, time, shortDescription, fullDescription, photographers, editor, galleryImages, colorTheme, color_theme } = req.body;

    const theme = colorTheme || color_theme || 'emerald';
    const result = await pool.query(
      `UPDATE recent_activities
       SET title = $1, subtitle = $2, date = $3, time = $4, short_description = $5, full_description = $6,
           photographers = $7, editor = $8, gallery_images = $9, color_theme = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        title,
        subtitle || '',
        date || '',
        time || '',
        shortDescription,
        fullDescription || shortDescription,
        JSON.stringify(Array.isArray(photographers) ? photographers : (photographers || '').split(',').map((s: string) => s.trim()).filter(Boolean)),
        Array.isArray(editor) ? editor.join(', ') : (editor || '').trim(),
        JSON.stringify(Array.isArray(galleryImages) ? galleryImages : []),
        theme,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to update activity:', error);
    res.status(500).json({ error: error?.message || 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM recent_activities WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Failed to delete activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

export default router;
