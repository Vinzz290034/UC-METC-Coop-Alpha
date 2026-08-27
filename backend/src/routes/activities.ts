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
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849623/uc_coop/gallery/gallery_2.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849626/uc_coop/gallery/gallery_4.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849631/uc_coop/gallery/gallery_5.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849636/uc_coop/gallery/gallery_6.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849640/uc_coop/gallery/gallery_10.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849644/uc_coop/gallery/gallery_11.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849648/uc_coop/gallery/gallery_13.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849652/uc_coop/gallery/gallery_15.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849656/uc_coop/gallery/gallery_18.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849661/uc_coop/gallery/gallery_19.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849665/uc_coop/gallery/gallery_22.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849670/uc_coop/gallery/gallery_24.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849673/uc_coop/gallery/gallery_25.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849678/uc_coop/gallery/gallery_30.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849684/uc_coop/gallery/gallery_34.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849690/uc_coop/gallery/gallery_36.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849696/uc_coop/gallery/gallery_39.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849703/uc_coop/gallery/gallery_42.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849709/uc_coop/gallery/gallery_44.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849712/uc_coop/gallery/gallery_47.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849717/uc_coop/gallery/gallery_51.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849721/uc_coop/gallery/gallery_59.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849725/uc_coop/gallery/gallery_62.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849729/uc_coop/gallery/gallery_65.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849734/uc_coop/gallery/gallery_68.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849738/uc_coop/gallery/gallery_73.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849741/uc_coop/gallery/gallery_76.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787849745/uc_coop/gallery/gallery_78.jpg'
    ];

    const defaultRinghopPhotos = [
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851228/uc_coop/ringhop/ringhop_1.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851233/uc_coop/ringhop/ringhop_2.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851237/uc_coop/ringhop/ringhop_3.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851242/uc_coop/ringhop/ringhop_4.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851247/uc_coop/ringhop/ringhop_5.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851252/uc_coop/ringhop/ringhop_6.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851257/uc_coop/ringhop/ringhop_7.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851260/uc_coop/ringhop/ringhop_8.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851264/uc_coop/ringhop/ringhop_9.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851268/uc_coop/ringhop/ringhop_10.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851273/uc_coop/ringhop/ringhop_11.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851276/uc_coop/ringhop/ringhop_12.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851279/uc_coop/ringhop/ringhop_13.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851282/uc_coop/ringhop/ringhop_14.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851286/uc_coop/ringhop/ringhop_15.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851289/uc_coop/ringhop/ringhop_16.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851293/uc_coop/ringhop/ringhop_17.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851296/uc_coop/ringhop/ringhop_18.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851301/uc_coop/ringhop/ringhop_19.jpg',
      'https://res.cloudinary.com/fncjex7d/image/upload/v1787851304/uc_coop/ringhop/ringhop_20.jpg',
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
          'A landmark event where members unite to chart the course for our cooperative.',
          'The 11th General Assembly brought together members to discuss cooperative governance, financial performance, and member welfare initiatives. Distinguished discussions on cooperative policies, sustainability programs, and the election of new leadership took place. Members engaged in meaningful conversations about expanding our services and strengthening our commitment to student welfare. Every voice contributed to shaping the cooperative\'s strategic direction for the upcoming year.\n\nKey highlights included the approval of new sustainability initiatives, the introduction of enhanced member benefits, and the unanimous election of the new board of directors. The assembly also featured presentations on financial performance, showcasing the cooperative\'s growth and stability. Members actively participated in workshops focused on cooperative principles, community engagement, and future development plans. The event concluded with a commitment to transparency, member empowerment, and continued excellence in serving the UC METC community.',
          JSON.stringify(['Vince Andrew Santoya', 'Kisses Peñera']),
          'Vince Andrew Santoya',
          JSON.stringify(defaultGaPhotos),
          'emerald'
        ]
      );
      await pool.query(
        `INSERT INTO recent_activities (
          id, title, subtitle, date, time, short_description, full_description, photographers, editor, gallery_images, color_theme, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )`,
        [
          'act-default-2',
          'RINGHOP CEREMONY 2026',
          'Honoring Academic Dedication and Professional Excellence',
          'June 30, 2026',
          '3:00 PM - 6:00 PM',
          'Celebrating the achievements and academic milestone of our maritime students as they receive their official rings.',
          'The Ringhop Ceremony 2026 marks a memorable milestone for maritime students at UC METC. Graduating cadets and members gather to receive their official rings in a grand celebration honoring academic perseverance, discipline, and professional excellence.',
          JSON.stringify(['Xela Elaine Murro', 'Vince Andrew Santoya']),
          'Vince Andrew Santoya',
          JSON.stringify(defaultRinghopPhotos),
          'blue'
        ]
      );
    } else {
      // Auto-update existing default activities if they hold outdated Cloudinary URLs
      await pool.query(
        `UPDATE recent_activities 
         SET gallery_images = $1 
         WHERE id = 'act-default-1' OR (title ILIKE '%assembly%' AND (gallery_images::text LIKE '%doas4qcdo%' OR gallery_images::text LIKE '%dph4hxexg%'))`,
        [JSON.stringify(defaultGaPhotos)]
      );
      await pool.query(
        `UPDATE recent_activities 
         SET gallery_images = $1 
         WHERE id = 'act-default-2' OR (title ILIKE '%ringhop%' AND (gallery_images::text LIKE '%doas4qcdo%' OR gallery_images::text LIKE '%dph4hxexg%'))`,
        [JSON.stringify(defaultRinghopPhotos)]
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
