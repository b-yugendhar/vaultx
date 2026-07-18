import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables. Please check your .env file!");
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password and insert
        const password_hash = await bcrypt.hash(password, 10);
        const { error } = await supabase
            .from('users')
            .insert([{ username, password_hash }]);
        
        if (error) throw error;
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Login User (Fetch CID)
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Fetch User
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match =await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Login successful', cid: user.cid || null });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/vault/cid', async (req, res) => {
    try {
        const { username, password, cid } = req.body;
        if (!username || !password || !cid) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Fetch User to Verify
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (fetchError || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password before saving CID
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update the CID
        const { error } = await supabase
            .from('users')
            .update({ cid: cid })
            .eq('id', user.id);

        if (error) throw error;

        res.status(200).json({ message: 'CID updated successfully' });
    } catch (err) {
        console.error('Update CID error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`VaultX Backend (Supabase) running on http://localhost:${PORT}`);
});
