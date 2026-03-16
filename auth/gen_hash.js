const bcrypt = require('bcryptjs')
const hash = bcrypt.hashSync('SuperAdmin@123', 10)
console.log(hash)
