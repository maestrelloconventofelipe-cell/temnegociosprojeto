const db = require('../src/config/db')
db.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', ['documentos'])
  .then(r => { console.log('cols:', JSON.stringify(r.rows)); process.exit(0) })
  .catch(e => { console.error('err:', e.message); process.exit(1) })
