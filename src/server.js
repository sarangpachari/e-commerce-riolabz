require('dotenv').config(); const connectDatabase = require('./config/db'); const app = require('./app');
const port = process.env.PORT || 5000;
connectDatabase().then(() => app.listen(port, () => console.log(`API listening on port ${port}`))).catch((error) => { console.error('Database connection failed:', error.message); process.exit(1); });
