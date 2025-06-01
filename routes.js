const express = require('express');
const router = express.Router();
const db = require('./connection.js');

router.get('/', (req, res) => {
	res.render('index');
});

router.get('/tablaPeriodica', (req, res) => {
	const z = parseInt(req.query.z, 10); // Convierte z a número entero
	const masa = parseInt(req.query.masa, 10);
	let query;

	if (z) {
		if (masa) {
			query = 'select * from elementos INNER JOIN isotopos ON elementos.numAtomico = isotopos.z WHERE elementos.numAtomico = ? order by case when isotopos.masaAtomica = ' + masa + ' then 0 else 1 end, isotopos.abundancia desc;';
		}
		else {
			query = 'select * from elementos INNER JOIN isotopos ON elementos.numAtomico = isotopos.z WHERE elementos.numAtomico = ? order by isotopos.abundancia DESC;';
		}
		// Ejecuta la consulta de forma segura con parámetros
		db.query(query, [z], (err, results) => {
			if (err) {
				console.error('Error ejecutando la consulta:', err);
				return res.status(500).send('Error en la base de datos');
			}

			if (results.length === 0) {
				return res.render('info', { elementos: null, mensaje: 'No se encontraron elementos.' });
			}


			// Renderiza la vista EJS con los datos obtenidos
			res.render('info', { datos: results[0], isotopos: results });
			// Envía el primer resultado (si esperas un único elemento)
		});
	} else {
		query = "select * from elementos"

		db.query(query, (err, results) => {
			if (err) {
				console.error('Error ejecutando la consulta:', err);
				return res.status(500).send('Error en la base de datos');
			}

			// Renderiza la vista EJS con los datos obtenidos
			res.render('tabla', { elementos: results });
			// Envía el primer resultado (si esperas un único elemento)
		});
	}
});

router.get('/elementos', (req, res) => {
	let type = req.query.type;
	let query = 'select numAtomico, ' + type + ' from elementos;';
	console.log(type);

	// Ejecuta la consulta de forma segura con parámetros
	db.query(query, (err, results) => {
		if (err) {
			console.error('Error ejecutando la consulta:', err);
			return res.status(500).send('Error en la base de datos');
		}

		if (results.length === 0) {
			return res.render('info', { elementos: null, mensaje: 'No se encontraron elementos.' });
		}

		switch (type) {
			case "grupo":
				res.render('clasificaciones/grupo', { query: results });
				break;

			case "lickable":
				res.render('clasificaciones/lickable', { query: results });
				break;
		}
	});
});

router.get('/laboratorio', (req, res) => {
	const get = req.query.m;

	if (get == undefined) {
		res.render('eleccionLab');
	} else {
		db.query('SELECT * FROM elementos', (err, elementos) => {
			if (err) throw err;

			let wrapper = elementos.map((elemento) => {
				return new Promise((resolve, reject) => {

					db.query(`SELECT Estados FROM oxidacion WHERE z = ${elemento.numAtomico}`, (err, category) => {
						if (err) {
							reject(err);
						} else {
							resolve(category[0]);
						};
					});
				});
			});


			Promise.all(wrapper).then((results) => {
				let arr = elementos.map((elemento, index) => {
					elemento.oxidacion = results[index];
					return elemento;
				});
				arr.forEach((wawa) => {
					const estadosStr = wawa?.oxidacion?.Estados;

					if (typeof estadosStr === 'string') {
						const estados = estadosStr.slice(1, -1).split(', ');
						wawa.oxidacion.Estados = estados;
					} else {
						wawa.oxidacion.Estados = [];
					}
				});

				res.render('laboratorio', { elementos: arr, get: get });
			}).catch((err) => {
				console.error(err);
			});
		});
	}
});

router.get('/community', (req, res) => {
	const get = req.query.q;
	const userData = req.session.user || null;
	let getNoti, msg, formData;

	switch (get) {
		case "sugerencias":
			let query = `SELECT s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo, 
                   GROUP_CONCAT(v.IDVote) AS IDVotes, 
                   GROUP_CONCAT(v.Tipo) As Likes, 
                   GROUP_CONCAT(v.IDUsuario) AS IDAutores, 
                   u.Username 
                   FROM sugerencias s 
                   LEFT JOIN votes v ON s.IDSugerencia = v.IDSugerencia 
                   LEFT JOIN usuarios u ON s.IDUsuario = u.IDUsuario 
                   WHERE Valido = 1 
                   GROUP BY s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo;`;

			db.query(query, (err, resultados) => {
				if (err) throw err;
				console.log(userData);
				res.render('sugerencias', { sugerencias: resultados, user: userData });
			});
			break;

		case "bitacora":
			res.render('bitacora');
			break;

		case "register":
			formData = req.session.formData;
			delete req.session.formData;
			getNoti = req.query.n;

			msg = "";
			if (getNoti) {
				msg = getNoti === "duplicated" ? "Ese nombre de usuario ya existe" : "Intentelo más tarde";
			}

			res.render("register", { user: userData, noti: msg, form: formData });
			break;

		case "login":
			formData = req.session.formData;
			delete req.session.formData;
			getNoti = req.query.n;

			msg = "";
			if (getNoti) {
				msg = getNoti === "notfound" ? "Usuario no encontrado" : "Intentelo más tarde";
			}

			res.render("login", { user: userData, noti: msg, form: formData });
			break;

		case "logout":
			req.session.destroy(err => {
				if (err) {
					console.error('Error al cerrar sesión:', err);
					return res.status(500).send("Error al cerrar sesión");
				}
				res.redirect('/community');
			});
			break;

		default:
			res.render('community', { user: userData });
			break;
	}
});

router.post('/loginProcess', (req, res) => {
	const { username, password } = req.body;

	const query = "SELECT * FROM usuarios WHERE Username = ? AND Password = ?";
	db.query(query, [username, password], (err, resultados) => {
		if (err) throw err;

		if (resultados.length === 0) {
			req.session.formData = [username, password];
			return res.redirect('/community?q=login&n=notfound');
		}

		const userData = {
			IDUsuario: resultados[0].IDUsuario,
			Username: resultados[0].Username,
			UserInfo: resultados[0].UserInfo
		};

		req.session.user = userData;
		req.session.save(err => {
			if (err) {
				console.error("Error al guardar sesión:", err);
				return res.status(500).send("Error de sesión");
			}
			res.redirect('/community');
		});
	});
});

router.post('/registerProcess', (req, res) => {
	const post = req.body;

	const query = "INSERT INTO usuarios (Username, Password, UserInfo, JoinDate) VALUES (?, ?, 0, ?)";
	const values = [post.username, post.password, getMySQLDatetime()];

	db.query(query, values, (err, resultados) => {
		if (err) {
			if (err.code === 'ER_DUP_ENTRY') {
				req.session.formData = post;
				return res.redirect('/community?q=register&n=duplicated');
			} else {
				console.error('❌ Error inesperado:', err);
				return res.status(500).send('Error del servidor');
			}
		}

		res.redirect('/community?q=login');
	});
});

function getMySQLDatetime() {
	let now = new Date();
	let year = now.getFullYear();
	let month = String(now.getMonth() + 1).padStart(2, "0"); // Mes comienza en 0
	let day = String(now.getDate()).padStart(2, "0");
	let hours = String(now.getHours()).padStart(2, "0");
	let minutes = String(now.getMinutes()).padStart(2, "0");
	let seconds = String(now.getSeconds()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.post('/sendSugerencia', (req, res) => {
	const post = req.body;
	let time = getMySQLDatetime();

	let query = "INSERT INTO sugerencias (IDUsuario, Titulo, Texto, Tipo, Fecha, Valido) VALUES ('" + post.idUsuario + "', '" + post.titulo + "', '" +
		post.texto + "', '" + post.tipo + "', '" + getMySQLDatetime() + "', 0);";

	db.query(query, (err, resultados) => {
		if (err) throw err;
	});

	res.redirect('/community?q=sugerencias');
});

router.post('/like', (req, res) => {
	const post = req.body;

	let query = "INSERT INTO votes (IDSugerencia, IDUsuario, Tipo) VALUES (" + post.idSugerencia + ", " + post.idUsuario + ", 'up');";

	db.query(query, (err, resultados) => {
		if (err) throw err;
	});

	console.log("Like");
});

router.post('/antilike', (req, res) => {
	const post = req.body;

	let query = "DELETE FROM votes WHERE IDSugerencia = " + post.idSugerencia + " AND IDUsuario = " + post.idUsuario + " AND Tipo = 'up';";

	db.query(query, (err, resultados) => {
		if (err) throw err;
	});

	console.log("AntiLike");
});

router.post('/dislike', (req, res) => {
	const post = req.body;

	let query = "INSERT INTO votes (IDSugerencia, IDUsuario, Tipo) VALUES (" + post.idSugerencia + ", " + post.idUsuario + ", 'down');";

	db.query(query, (err, resultados) => {
		if (err) throw err;
	});
	console.log("DisLike");
});

router.post('/antidislike', (req, res) => {
	const post = req.body;

	let query = "DELETE FROM votes WHERE IDSugerencia = " + post.idSugerencia + " AND IDUsuario = " + post.idUsuario + " AND Tipo = 'down';";

	db.query(query, (err, resultados) => {
		if (err) throw err;
	});
	console.log("AntiDisLike");
});

router.get('/mod', (req, res) => {
	let query = "SELECT s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo, s.Fecha, u.Username FROM sugerencias s LEFT JOIN usuarios u ON s.IDUsuario = u.IDUsuario WHERE Valido = 0 AND Revisado = 0 GROUP BY s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo ORDER BY Fecha DESC";

	db.query(query, (err, resultados) => {
		if (err) throw err;

		res.render('mod', { sugerencias: resultados });
	});
});

router.get('/loadMod', (req, res) => {
	let where = "", order = "";
	let type, fecha, validar, revision;

	if (!req.query.f) {
		req.query.f = "reciente";
	}

	if (!req.query.t) {
		req.query.t = "all";
	}

	if (!req.query.v) {
		req.query.v = 0;
	}

	if (!req.query.r) {
		req.query.r = 0;
	}

	let cont = 0;
	Object.entries(req.query).forEach(([key, value]) => {
		cont++;

		if (key != "f") {
			if (cont == 1) {
				switch (key) {
					case "t":
						if (value != "all") {
							where += "WHERE Tipo = '" + value + "'";
						}
						break;

					case "v":
						where += "WHERE Valido = " + value;
						break;

					case "r":
						where += "WHERE Revisado = " + value;
						break;
				}
			} else {
				switch (key) {
					case "t":
						if (value != "all") {
							where += " AND Tipo = '" + value + "'";
						}
						break;

					case "v":
						where += " AND Valido = " + value;
						break;

					case "r":
						where += " AND Revisado = " + value;
				}
			}
		} else {
			switch (value) {
				case "reciente":
					order = "ORDER BY Fecha DESC";
					break;

				case "antiguo":
					order = "ORDER BY Fecha ASC";
					break;
			}
		}
	});

	let query = "SELECT s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo, s.Fecha, u.Username FROM sugerencias s LEFT JOIN usuarios u ON s.IDUsuario = u.IDUsuario " + where + " GROUP BY s.IDSugerencia, s.IDUsuario, s.Texto, s.Tipo, s.Titulo " + order + ";";
	console.log(query);

	db.query(query, (err, resultados) => {
		if (err) throw err;

		res.render('mod/sugerencia', { sugerencias: resultados });
	});
});

router.post('/aceptar', (req, res) => {
	const idSugerencia = req.body.idSugerencia;
	let query = "UPDATE sugerencias SET Valido = 1, Revisado = 1 WHERE IDSugerencia = " + idSugerencia + ";";
	db.query(query, (err, resultados) => {
		if (err) throw err;
	});
});

router.post('/rechazar', (req, res) => {
	const idSugerencia = req.body.idSugerencia;
	let query = "UPDATE sugerencias SET Valido = 0, Revisado = 1 WHERE IDSugerencia = " + idSugerencia + ";";
	db.query(query, (err, resultados) => {
		if (err) throw err;
	});
});

module.exports = router;
