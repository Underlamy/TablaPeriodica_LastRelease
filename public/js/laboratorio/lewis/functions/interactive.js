import * as THREE from '../../../three.module.js';
import { camera, scene, width, height } from '../init.js';
import { eliminar, basura } from './interface.js';
import { info } from '../infoInit.js';
import { Line2 } from '../../../Line2.js';
import { LineMaterial } from '../../../LineMaterial.js';
import { LineGeometry } from '../../../LineGeometry.js';
import { LineSegmentsGeometry } from '../../../LineSegmentsGeometry.js';
import { LineSegments2 } from '../../../LineSegments2.js';
import { warn } from '../alert.js';

let elemento = [], dummies = [], molDummies = [], tiempo = [], oxi = [], relLink = [],
    attractions = [], compound = [], linkCont = 0;
const container = document.getElementById("canvaElemento");

//mouse
const mouseMove = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let atomSelected = undefined, infoSelected = undefined;
let raycasterX, raycasterY, mouseX, mouseY, mouseDown = false;
let raycasted, follow;

function getWidth() {
    return parseInt(window.getComputedStyle(container).width);
}

function getHeight() {
    return parseInt(window.getComputedStyle(container).height);
}

const objUpdate = [];
function objAnimationUpdate(object, behavior) {
    object.userData.animationUpdate = behavior;
    objUpdate.push(object);
}

//mouse functions
function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    mouseMove.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseMove.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouseMove, camera);
    const clickObject = raycaster.intersectObjects(scene.children);
    raycasted = clickObject[0];

    if (clickObject.length > 0) {
        if (mouseX && mouseY) {
            if (clickObject[0].object.name == "fondo") {
                raycasterX = clickObject[0].point.x;
                raycasterY = clickObject[0].point.y;
            }
            else {
                raycasterX = clickObject[1].point.x;
                raycasterY = clickObject[1].point.y;
            }
        }
    }

    if (mouseDown == true && atomSelected != undefined && clickObject[0] != undefined) {
        if (elemento[atomSelected].obj3D.userData.draggable == true) {
            scene.getObjectById(atomSelected).position.set(raycasterX, raycasterY, 0);
            elemento[atomSelected].x = raycasterX;
            elemento[atomSelected].y = raycasterY;
            dummies[atomSelected].position.x = raycasterX;
            dummies[atomSelected].position.y = raycasterY;

            let wiwi = toScreenPosition(scene.getObjectById(atomSelected), camera);
            document.getElementById(atomSelected).style.left = (wiwi.x - 20) + "px";
            document.getElementById(atomSelected).style.top = (wiwi.y - 20) + "px";
        }else if (elemento[atomSelected].obj3D.userData.draggable) {
            let infoObj = elemento[elemento[atomSelected].obj3D.userData.draggable.id];
            infoObj.obj3D.position.set(raycasterX, raycasterY, 0);
            dummies[infoObj.id].position.x = raycasterX;
            dummies[infoObj.id].position.y = raycasterY;
            infoObj.x = raycasterX;
            infoObj.y = raycasterY;
        }
    }
}

let stopLineRegistered = false;
window.addEventListener("mousedown", function (event) {
    event.preventDefault();
    mouseDown = true;

    raycaster.setFromCamera(mouseMove, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    const firstObj = intersects[0].object;

    if (intersects.length > 0 && firstObj.userData.draggable) {
        atomSelected = firstObj.id;
    }

    //Si el objeto clickeado fue un electron sin par
    if (firstObj.userData.electron && firstObj.userData.pair == undefined && firstObj.userData.child == undefined) {
        follow = firstObj;
        var target = new THREE.Vector3();

        //Obtenemos coordenadas globales del electron
        firstObj.getWorldPosition(target);

        //Crear Linea de Enlace
        let electronLink = initializeElectronLink(target.x, target.y, raycasterX, raycasterY);

        //Crea loop para actualizar posiciones de el Enlance
        const update = setInterval(() => {
            updateElectronLink(firstObj, electronLink.line, electronLink.positions, electronLink.geometry, update);
        }, 40);
    }

    container.style.zIndex = 1;
});

function initializeElectronLink(startX, startY, endX, endY) {
    //Seteamos los puntos de inicio y fin de la lina
    let positions = [startX, startY, 0, endX, endY, 0];

    //Inicializar la linea
    const lineGeometry = new LineGeometry();
    lineGeometry.setPositions(positions);

    const lineMaterial = new LineMaterial({
        color: 0xffffff,
        linewidth: 5,
    });

    lineMaterial.resolution.set(window.innerWidth, window.innerHeight);

    const line = new Line2(lineGeometry, lineMaterial);
    scene.add(line);

    return {
        line: line,
        positions: positions,
        geometry: lineGeometry
    }
}

function updateElectronLink(electron, line, positions, geometry, update) {
    var target = new THREE.Vector3();
    electron.getWorldPosition(target);

    positions = [target.x, target.y, 0, raycasterX, raycasterY, 0];
    geometry.setPositions(positions);
    electron.parent.userData.rotate = false;

    relLink[electron.id] = {
        'dad': electron,
        'mom': undefined,
        'child': line
    };

    const stopElectronListener = () => stopElectronLink(electron, line, positions, geometry, update, stopElectronListener);
    if (!stopLineRegistered) {
        document.addEventListener("mouseup", stopElectronListener);
        stopLineRegistered = true;
    }
}

function stopElectronLink(electron, line, positions, geometry, update, listener) {
    var target = new THREE.Vector3();

    stopLineRegistered = false;
    clearInterval(update);
    document.removeEventListener("mouseup", listener);

    electron.parent.userData.rotate = true;

    //Si el mouse acaba en otro electron
    if (raycasted.object.userData.electron && raycasted.object != line.parent &&
        raycasted.object.userData.pair == undefined && raycasted.object.parent != electron.parent) {


        let momInfoObj = elemento[electron.parent.userData.parent.id];
        let dadInfoObj = elemento[raycasted.object.parent.userData.parent.id];

        let compoundInfo = newCompound(electron.parent.userData.parent, raycasted.object.parent.userData.parent);
        let compuesto = new infoObjCompound(compoundInfo);
        compound.push(compuesto);

        let links = createLink(raycasted.object, electron);
        console.log(links.dad.type.name);

        dadInfoObj.links.push(links.dad);
        momInfoObj.links.push(links.mom);

        compuesto.componentes.forEach(componente => {
            componente.child = compuesto;
            componente.elemeneto = false;
        });

        line.userData.dad = electron;
        line.userData.mom = raycasted.object;

        if (links.dad.type.name == "ionico") {
            scene.remove(line);
        } else {
            attractions.push({
                nucleo1: electron.parent.userData.parent,
                nucleo2: raycasted.object.parent.userData.parent,
                electron1: electron,
                electron2: raycasted.object,
                enlace: line
            });

            electron.userData.child = line;
            raycasted.object.userData.child = line;


            positions = [target.x, target.y, 0, raycasterX, raycasterY, 0];
            geometry.setPositions(positions);

            relLink[electron.id].mom = raycasted.object;
            objAnimationUpdate(relLink[electron.id].dad, () => {
                positions = [relLink[electron.id].dad.getWorldPosition(new THREE.Vector3()).x, relLink[electron.id].dad.getWorldPosition(new THREE.Vector3()).y, 0,
                relLink[electron.id].mom.getWorldPosition(new THREE.Vector3()).x, relLink[electron.id].mom.getWorldPosition(new THREE.Vector3()).y, 0];
                geometry.setPositions(positions);
            });

            objAnimationUpdate(relLink[electron.id].mom, () => {
                positions = [relLink[electron.id].dad.getWorldPosition(new THREE.Vector3()).x, relLink[electron.id].dad.getWorldPosition(new THREE.Vector3()).y, 0,
                relLink[electron.id].mom.getWorldPosition(new THREE.Vector3()).x, relLink[electron.id].mom.getWorldPosition(new THREE.Vector3()).y, 0];
                geometry.setPositions(positions);
            });
        }
    } else {
        scene.remove(line);
    }
}

function createLink(elecObj1, elecObj2) {
    let elementInfoObj1 = elemento[elecObj1.parent.userData.parent.id];
    let elementInfoObj2 = elemento[elecObj2.parent.userData.parent.id];

    let link = {
        dad: {},
        mom: {}
    };

    let electro = Math.abs(elementInfoObj1.electroNegatividad - elementInfoObj2.electroNegatividad).toFixed(2);
    let name;

    if (electro >= 1.7) {
        name = "ionico"

        if (elementInfoObj1.electroNegatividad > elementInfoObj2.electroNegatividad) {
            transferElectron(elecObj1, elecObj2);
        } else {
            transferElectron(elecObj2, elecObj1);
        }
    } else {
        name = "covalente"
    }

    link.dad = {
        id: elecObj1.id,
        parents: [elecObj1, elecObj2],
        type: {
            electroNegatividad: electro,
            name: name
        }
    }

    link.mom = {
        id: elecObj2.id,
        parents: [elecObj2, elecObj1],
        type: {
            electroNegatividad: electro,
            name: name
        }
    }

    return link;
}

function transferElectron(elecObj1, elecObj2) {
    //elecObj1 siempre sera el objeto mas electronegativo
    //debugger;
    let reciever = elecObj1.parent;
    let donor = elecObj2.parent;

    donor.remove(elecObj2);
    reciever.add(elecObj2);

    let x = reciever.position.x + (Math.cos(elecObj1.userData.angulo * (Math.PI / 180)) * (elecObj1.userData.radio + elecObj2.userData.radio));
    let y = reciever.position.y + (Math.sin(elecObj1.userData.angulo * (Math.PI / 180)) * (elecObj1.userData.radio + elecObj2.userData.radio));

    console.log(x, y);
    donor.userData.parent.position.set(x, y, 0);
    donor.position.set(x, y, 0);

    elecObj1.position.set((Math.cos((elecObj1.userData.angulo + 20) * (Math.PI / 180)) * elecObj1.userData.radio), (Math.sin((elecObj1.userData.angulo + 20) * (Math.PI / 180)) * elecObj1.userData.radio), 0);
    elecObj2.position.set((Math.cos((elecObj1.userData.angulo - 20) * (Math.PI / 180)) * elecObj1.userData.radio), (Math.sin((elecObj1.userData.angulo - 20) * (Math.PI / 180)) * elecObj1.userData.radio), 0);

    anclarObjetos(reciever.userData.parent, donor.userData.parent);
}

//El hijo seguira las coordenadas del padre
function anclarObjetos(parent, child) {
    let x = parent.position.x - child.position.x;
    let y = parent.position.y - child.position.y;

    objAnimationUpdate(parent, () => {
        child.position.set(parent.position.x - x, parent.position.y - y, 0);
        dummies[child.id].position.set(parent.position.x - x, parent.position.y - y, 0);
        elemento[child.id].x = parent.position.x - x;
        elemento[child.id].y = parent.position.y - y;

        child.userData.draggable = parent;
    });
}

function infoObjCompound(obj) {
    this.simbolo = obj.simbolo;
    this.nombre = obj.nombre;
    this.tipo = obj.tipo;
    this.componentes = obj.componentes;
}

function addLinkCont() {
    linkCont++;
    document.getElementsByClassName("alert-box")[0].style.opacity = 0;
}

function newCompound(obj1, obj2) {
    addLinkCont();

    let infoObj1 = elemento[obj1.id];
    let infoObj2 = elemento[obj2.id];
    let objs = getComponents(infoObj1, infoObj2);

    let type;
    let nombre, simbolo;

    let metales = ["metalesAlcalinos", "alcalinoTerreos", "metalesTransicion",
        "otrosMetales", "metaloides", "lantanidos", "actinidos", "otrosMetales"];

    let noMetales = ["noMetales", "halogenos", "gasesNobles"];
    let noMetalesElec = ["F", "Cl", "Br", "I", "O", "S", "Se"];
    let noMetalesNoElec = ["N", "P", "As", "Sb"];
    const halogenos = ['fluor', 'cloro', 'bromo', 'yodo', 'astato'];

    //SI es el compuesto es de un solo tipo de elemento
    if (objs.tipos == 1 && objs.total > 1) {
        nombre = infoObj1.nombre;
        simbolo = infoObj1.simbolo;
        obj1.material.color.set(getTypeColor(infoObj1.tipo));
        obj2.material.color.set(getTypeColor(infoObj1.tipo));
        simbolo = simbolo + "<sub>" + objs.total + "</sub>"
        type = infoObj1.tipo
    }

    //Si es un compuesto binario
    if (objs.tipos == 2) {
        objs.componentes.forEach(obj => {
            let hayMetal = objs.componentes.some(comp => metales.includes(comp.tipo));
            let hayNoMetal = objs.componentes.some(comp => noMetales.includes(comp.tipo));
            const sonMetales = objs.componentes.every(comp => metales.includes(comp.tipo));
            const sonNoMetales = objs.componentes.every(comp => noMetales.includes(comp.tipo));


            if (hayMetal && hayNoMetal) {
                let metal = objs.componentes.find(comp => metales.includes(comp.tipo));
                let noMetal = objs.componentes.find(comp => noMetales.includes(comp.tipo));

                simbolo = metal.simbolo + "<sub>" + objs[metal.nombre] + "</sub>" + noMetal.simbolo + "<sub>" + objs[noMetal.nombre] + "</sub>"
                nombre = noMetal.nombre + "uro de " + metal.nombre;
                type = "salesBinarias";
            }

            if (sonMetales) {
                let obj1 = obj;
                let obj2 = objs.componentes.find(componente => componente.nombre.toLowerCase() !== obj1.nombre);

                simbolo = obj1.simbolo + "<sub>" + objs[obj1.nombre] + "</sub>" + obj2.simbolo + "<sub>" + objs[obj2.nombre] + "</sub>"
                nombre = obj1.nombre + "-" + obj2.nombre;
                type = "aleacion"
            }

            if (sonNoMetales) {
                let obj1 = obj;
                let obj2 = objs.componentes.find(componente => componente.nombre.toLowerCase() !== obj1.nombre);

                if (obj1.electroNegatividad >= obj2.electroNegatividad) {
                    simbolo = obj2.simbolo + "<sub>" + objs[obj2.nombre] + "</sub>" + obj1.simbolo + "<sub>" + objs[obj1.nombre] + "</sub>";
                    nombre = obj1.nombre + "uro de " + obj2.nombre;
                } else {
                    simbolo = obj1.simbolo + "<sub>" + objs[obj1.nombre] + "</sub>" + obj2.simbolo + "<sub>" + objs[obj2.nombre] + "</sub>";
                    nombre = obj2.nombre + "uro de " + obj1.nombre;
                }
            }

            if (obj.simbolo === "H") {
                let otherElement = objs.componentes.find(componente => componente.nombre.toLowerCase() !== 'hidrogeno');

                if (noMetales.includes(otherElement.tipo)) {
                    if (otherElement.grupo == 17 || otherElement.grupo == 16) {
                        type = "hidracidos";
                        nombre = "Acido " + raizNoMetal(otherElement.nombre) + "hidrico";
                        simbolo = "H<sub>" + objs.hidrogeno + "</sub>" + otherElement.simbolo + "<sub>" + objs[otherElement.nombre] + "</sub>";

                    } else {
                        type = "hidrurosNoMetalicos";
                        nombre = "Hidruro de " + otherElement.nombre;
                        simbolo = otherElement.simbolo + "<sub>" + objs[otherElement.nombre] + "</sub>" + "H<sub>" + objs.hidrogeno + "</sub>";
                    }
                } else if (metales.includes(otherElement.tipo)) {
                    type = "hidrurosMetalicos";
                    simbolo = otherElement.simbolo + "<sub>" + objs[otherElement.nombre] + "</sub>" + "H<sub>" + objs.hidrogeno + "</sub>";
                    nombre = "Hidruro de " + otherElement.nombre + numRomanos(otherElement.oxidacion);
                }
            }

            if (obj.simbolo === "O") {
                let otherElement = objs.componentes.find(componente => componente.nombre.toLowerCase() !== 'oxigeno');

                if (noMetales.includes(otherElement.tipo)) {
                    type = "oxidosNoMetalicos";
                    nombre = prefijosGriegos(objs.oxigeno) + "oxido de " + prefijosGriegos(objs[otherElement.nombre]) + otherElement.nombre + numRomanos(otherElement.oxidacion);
                } else if (metales.includes(otherElement.tipo)) {
                    type = "oxidosMetalicos";
                    if (infoObj1.simbolo === "O") nombre = "Oxido de " + otherElement.nombre +
                        numRomanos(otherElement.oxidacion);
                }

                simbolo = otherElement.simbolo + "<sub>" + objs[otherElement.nombre] + "</sub>" + "O" + "<sub>" + objs.oxigeno + "</sub>";
            }
        });
    }

    objs.componentes.forEach(componente => {
        componente.obj3D.material.color.set(getTypeColor(type));
    });

    return {
        nombre: nombre,
        simbolo: simbolo,
        tipo: type,
        componentes: objs.componentes
    };
}

function prefijosGriegos(cantidad) {
    let prefijo;
    switch (cantidad) {
        case 1:
            prefijo = "mono"
            break;

        case 2:
            prefijo = "di"
            break;

        case 3:
            prefijo = "tri"
            break;

        case 4:
            prefijo = "tetra"
            break;

        case 5:
            prefijo = "penta"
            break;

        case 6:
            prefijo = "hexa"
            break;

        case 7:
            prefijo = "hepta"
            break;

        case 8:
            prefijo = "octa"
            break;

        case 9:
            prefijo = "nona"
            break;

        case 10:
            prefijo = "deca"
            break;
    }

    return prefijo;
}

function raizNoMetal(elemento) {
    const raices = {
        'cloro': 'clor',
        'bromo': 'brom',
        'yodo': 'yod',
        'flúor': 'fluor',
        'fluor': 'fluor',
        'azufre': 'sulf',
        'sulfuro': 'sulf',
        'fósforo': 'fosf',
        'fosforo': 'fosf',
        'nitrógeno': 'nitr',
        'nitrogeno': 'nitr',
        'carbono': 'carbon',
        'selenio': 'seleni',
        'telurio': 'telur',
        'boro': 'bor',
        'hidrógeno': 'hidr',
        'hidrogeno': 'hidr',
        'cianuro': 'cian',
        'cian': 'cian'
    };

    // Convertir a minúsculas para evitar problemas con mayúsculas
    const clave = elemento.toLowerCase();

    if (raices.hasOwnProperty(clave)) {
        return raices[clave];
    } else {
        return 'Raíz no definida para este elemento';
    }
}

function getComponents(obj1, obj2) {
    let objs = [];
    const contador = { total: 0, tipos: 0 };

    if (!obj1.child) {
        objs.push(obj1);
    } else {
        console.log(obj1.child);
        obj1.child.componentes.forEach(obj => {
            objs.push(obj);
        });
    }

    if (!obj2.child) {
        objs.push(obj2);
    } else {
        obj2.child.componentes.forEach(obj => {
            objs.push(obj);
        });
    }

    for (const obj of objs) {
        const nombre = obj.nombre;

        if (contador[nombre]) {
            contador[nombre]++;
        } else {
            contador[nombre] = 1;
            contador.tipos++;
        }
        contador.total++;
    }
    contador.componentes = objs;

    return contador;
}

function getTypeColor(name) {
    for (let cont = 0; cont < colores.length; cont++) {
        if (colores[cont][0] == name) {
            return colores[cont][1];
        }
    }
}

function getTypeName(name) {
    for (let cont = 0; cont < nombres.length; cont++) {
        if (nombres[cont][0] == name) {
            return nombres[cont][1];
        }
    }
}

window.addEventListener("mouseup", function (event) {
    mouseDown = false;

    if (atomSelected) {
        eliminar(event);
        basura(event);

        atomSelected = undefined;
    }

    container.style.zIndex = -1;
});

window.addEventListener("contextmenu", (event) => {
    event.preventDefault();

    raycaster.setFromCamera(mouseMove, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0 && intersects[0].object.userData.draggable) {
        document.getElementsByClassName("objectInfo")[0].style.opacity = "100%";
        infoSelected = intersects[0].object.id;

        let titule = [];
        let texte = [];
        if (elemento[infoSelected].elemento) {
            for (const [key, value] of Object.entries(elemento[infoSelected])) {
                titule = titule.concat(`${key}`);
                texte = texte.concat(`${value}`);
            }
        } else {
            for (const [key, value] of Object.entries(elemento[infoSelected].child)) {
                titule = titule.concat(`${key}`);
                texte = texte.concat(`${value}`);
            }
        }

        info(infoSelected, titule, texte);
    }
});

function radioAtomico(periodo, grupo) {
    let radio;

    radio = (20 * periodo) * (((grupo - 18) * -1) / 10);
    if (radio < 51) {
        radio = 50;
    }

    return radio;
}

function descomponer(id) {
    scene.remove(scene.getObjectById(id));
    document.getElementById(id).remove();
    elemento[id] = undefined;

    tiempo[atomSelected] = undefined;
    oxi[atomSelected] = undefined;

    atomSelected = undefined;
}

function vida() {
    for (let cont = 0; cont < tiempo.length; cont++) {
        tiempo[cont] = tiempo[cont] - 1;
        if (tiempo[cont] <= 0) {
            try {
                for (let cont1 = 0; cont1 < elemento[cont].componentes.length; cont1++) {
                    let element = elemento[cont].componentes[cont1];
                    element.subindice = 1;
                    spawn(document.getElementById(element.simbolo + "-" + element.oxidacion), element, elemento[cont]);
                }

                warn("info", "compuesto " + document.getElementById(cont).innerHTML + " se ha desestabilizado");

                scene.remove(scene.getObjectById(cont));
                document.getElementById(cont).remove();
                elemento[cont] = undefined;
            } catch (err) {
                console.log(err);
                console.log(cont);
                console.log(tiempo);
                console.log(elemento);
            }
            tiempo[cont] = undefined;
        }
    }
}

function gravedad() {
    for (let cont = 0; cont < elemento.length; cont++) {
        if (document.getElementById(cont) != undefined && atomSelected != cont) {
            let wawa = elemento[cont].oxidacion;
            if (wawa <= -1) {
                wawa = wawa * -1;
            }

            oxi[cont] = {
                "oxidacion": 0,
                "x": 0,
                "y": 0
            };

            for (let cont1 = 0; cont1 < elemento.length; cont1++) {
                if (document.getElementById(cont1) != undefined && cont != cont1 && atomSelected != cont1) {
                    let wewe = elemento[cont1].oxidacion;
                    if (wewe <= -1) {
                        wewe = wewe * -1;
                    }

                    if (elemento[cont].x - (wawa * 50) <= elemento[cont1].x + (wewe * 50)
                        && elemento[cont].x + (wawa * 50) >= elemento[cont1].x - (wewe * 50)
                        && elemento[cont].y - (wawa * 50) <= elemento[cont1].y + (wewe * 50)
                        && elemento[cont].y + (wawa * 50) >= elemento[cont1].y - (wewe * 50)) {

                        if (elemento[cont].oxidacion >= 1) {
                            if (elemento[cont1].oxidacion >= 1) {
                                oxi[cont].oxidacion += parseInt(elemento[cont1].oxidacion);
                                oxi[cont].x += elemento[cont].x - elemento[cont1].x;
                                oxi[cont].y += elemento[cont].y - elemento[cont1].y;
                            }
                        } else if (elemento[cont].oxidacion <= -1) {
                            if (elemento[cont1].oxidacion <= -1) {
                                oxi[cont].oxidacion += -1 * (parseInt(elemento[cont1].oxidacion));
                                oxi[cont].x += elemento[cont].x - elemento[cont1].x;
                                oxi[cont].y += elemento[cont].y - elemento[cont1].y;
                            } else if (elemento[cont1].oxidacion >= 1) {
                                oxi[cont].oxidacion += oxi[cont].oxidacion + (-1 * (parseInt(elemento[cont1].oxidacion)));
                                oxi[cont].x += elemento[cont].x - elemento[cont1].x;
                                oxi[cont].y += elemento[cont].y - elemento[cont1].y;
                            }
                        }
                    }
                }
            }
        }
    }

    for (let cont = 0; cont < oxi.length; cont++) {
        if (oxi[cont] != undefined && scene.getObjectById(cont) != undefined) {
            if (scene.getObjectById(cont).position.x + (elemento[cont].radioAtomico * 2) <= (width / 2) * 0.65 && scene.getObjectById(cont).position.x - (elemento[cont].radioAtomico * 1.75) >= -(width / 2)
                && scene.getObjectById(cont).position.y + (elemento[cont].radioAtomico * 1.75) <= height / 2 && scene.getObjectById(cont).position.y - (elemento[cont].radioAtomico * 1.75) >= -(height / 2)) {

                if (oxi[cont].oxidacion >= 1) {
                    let a = oxi[cont].x;
                    let b = oxi[cont].y;
                    let c = Math.sqrt((a * a) + (b * b));
                    let beta = b / c;
                    let alfa = a / c;
                    b = beta * oxi[cont].oxidacion;
                    a = alfa * oxi[cont].oxidacion;

                    scene.getObjectById(cont).position.set(scene.getObjectById(cont).position.x + a, scene.getObjectById(cont).position.y + b, 0);
                    elemento[cont].x = elemento[cont].x + a;
                    elemento[cont].y = elemento[cont].y + b;
                } else if (oxi[cont].oxidacion <= -1) {
                    let a = -oxi[cont].x;
                    let b = -oxi[cont].y;
                    let c = Math.sqrt((a * a) + (b * b));
                    let beta = b / c;
                    let alfa = a / c;
                    b = beta * oxi[cont].oxidacion;
                    a = alfa * oxi[cont].oxidacion;

                    scene.getObjectById(cont).position.set(scene.getObjectById(cont).position.x - a, scene.getObjectById(cont).position.y - b, 0);
                    elemento[cont].x = elemento[cont].x - a;
                    elemento[cont].y = elemento[cont].y - b;
                }
            }
        }
    }
}

//Init Atom
function getColor(HTMLtarget) {
    for (let cont = 0; cont < colores.length; cont++) {
        if (colores[cont][0] == HTMLtarget.getAttribute("data-tipo")) {
            return colores[cont][1];
        }
    }
}

function createNucleus(color, radius) {
    const geometry = new THREE.IcosahedronGeometry(radius, 0);
    const material = new THREE.MeshToonMaterial({ color: color, transparent: true });

    const wireframeGeometry = new THREE.WireframeGeometry(geometry);
    const linesGeometry = new LineSegmentsGeometry().setPositions(wireframeGeometry.attributes.position.array);

    const wireframeMaterial = new LineMaterial({
        color: color,
        linewidth: 3, // Ajusta el grosor (unidades del mundo)
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        transparent: true,
        opacity: 0
    });

    const wireframe = new LineSegments2(linesGeometry, wireframeMaterial);

    let nucleus = new THREE.Mesh(geometry, material);
    nucleus.name = "nucleo";
    nucleus.userData.draggable = true;
    scene.add(nucleus);

    nucleus.userData.wireframe = function (active) {
        if (active == true) {
            nucleus.add(wireframe);
            wireframe.material.opacity = 1;
            nucleus.material.opacity = 0;
        } else {
            nucleus.remove(wireframe);
            wireframe.material.opacity = 0;
            nucleus.material.opacity = 1;
        }
    }

    return nucleus;
}

//Para crear elementos HTML que sigan a un objeto de THREE JS
function attachableHTML(obj3D, text) {
    let attachable = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(attachable);
    attachable.setAttribute("id", obj3D.id);
    attachable.innerHTML = text;

    return attachable;
}

function infoObj(HTMLtarget, obj3D) {
    this.simbolo = HTMLtarget.getAttribute("data-simbolo");
    this.nombre = HTMLtarget.getAttribute("data-nombre");
    this.tipo = HTMLtarget.getAttribute("data-tipo");
    this.oxidacion = 0;
    this.z = HTMLtarget.getAttribute("data-numatomico");
    this.periodo = HTMLtarget.getAttribute("data-periodo");
    this.grupo = HTMLtarget.getAttribute("data-grupo");
    this.electroNegatividad = HTMLtarget.getAttribute("data-electroNegatividad");
    this.radioAtomico = radioAtomico(HTMLtarget.getAttribute("data-periodo"), HTMLtarget.getAttribute("data-grupo"));
    this.configE = new elementoConfigE(HTMLtarget.getAttribute("data-numatomico"), HTMLtarget.getAttribute("data-superindice"));
    this.id = atomSelected;
    this.subindice = 1;
    this.elemento = true;
    this.x = obj3D.position.x;
    this.y = obj3D.position.y;
    this.angle = Math.floor(Math.random() * 360);
    this.rgb = [obj3D.material.color.r, obj3D.material.color.g, obj3D.material.color.b];
    this.obj3D = obj3D;
    this.links = [];
}

function createElectrons(nucleus, numElectrons) {
    dummies[nucleus.id] = new THREE.Mesh();
    dummies[nucleus.id].position.x = elemento[atomSelected].x;
    dummies[nucleus.id].position.y = elemento[atomSelected].y;
    dummies[nucleus.id].userData.rotate = true;
    dummies[nucleus.id].userData.parent = nucleus;
    dummies[nucleus.id].name = "dummy";
    scene.add(dummies[atomSelected]);

    const posElectrons = [[false, false], [false, false], [false, false], [false, false]];
    for (let cont = 0; cont < numElectrons; cont++) {
        if (cont <= 3) {
            posElectrons[cont][0] = true;
        } else {
            posElectrons[cont - 4][1] = true;
        }
    }

    const geometryElectron = new THREE.IcosahedronGeometry(20, 0);
    const materialElectron = new THREE.MeshToonMaterial({ color: 0xEEEEEE });
    const angle = [0, 180, 90, 270];
    let radio = elemento[atomSelected].radioAtomico + 50;
    let electron;

    for (let cont = 1; cont <= posElectrons.length; cont++) {
        let pair = JSON.stringify(posElectrons[cont - 1]);

        switch (pair) {
            case JSON.stringify([true, true]):
                electron = new THREE.Mesh(geometryElectron, materialElectron);
                dummies[nucleus.id].add(electron);
                electron.userData.electron = true;
                electron.userData.pair = true;
                electron.position.set((Math.cos((angle[cont - 1] - 20) * (Math.PI / 180)) * radio), (Math.sin((angle[cont - 1] - 20) * (Math.PI / 180)) * radio), 0);

                electron = new THREE.Mesh(geometryElectron, materialElectron);
                dummies[nucleus.id].add(electron);
                electron.userData.electron = true;
                electron.userData.pair = true;
                electron.position.set((Math.cos((angle[cont - 1] + 20) * (Math.PI / 180)) * radio), (Math.sin((angle[cont - 1] + 20) * (Math.PI / 180)) * radio), 0);
                break;

            case JSON.stringify([true, false]):
                electron = new THREE.Mesh(geometryElectron, materialElectron);
                dummies[nucleus.id].add(electron);
                electron.userData.electron = true;
                electron.position.set((Math.cos(angle[cont - 1] * (Math.PI / 180)) * radio), (Math.sin(angle[cont - 1] * (Math.PI / 180)) * radio), 0);
                electron.userData.angulo = (angle[cont - 1]);
                electron.userData.radio = radio
                break;
        }
    }
}
//End Init Atom

//functions
export function crearAtomo(event) {
    container.style.zIndex = 1;
    let selected = event.currentTarget;

    let nucleo = createNucleus(getColor(selected), radioAtomico(selected.getAttribute("data-periodo"), selected.getAttribute("data-grupo")));
    atomSelected = nucleo.id;
    nucleo.name = "nucleo";
    nucleo.position.set(raycasterX, raycasterY, 0);

    const nombre = attachableHTML(nucleo, selected.getAttribute("data-simbolo"));
    nombre.setAttribute("class", "nombre3D");

    elemento[atomSelected] = new infoObj(selected, nucleo);

    createElectrons(nucleo, elemento[atomSelected].configE.valencia);

    if (elemento[atomSelected].simbolo == null) {
        console.error("objeto " + atomSelected + " corrputo");
        descomponer(atomSelected);
    }
}
window.crearAtomo = crearAtomo;

function spawn(target, child, parent) {
    let colorNucleo;

    for (let cont = 0; cont < colores.length; cont++) {
        if (colores[cont][0] == target.getAttribute("data-tipo")) {
            colorNucleo = colores[cont][1];
        }
    }

    const geometry = new THREE.IcosahedronGeometry(radioAtomico(target.getAttribute("data-periodo"), target.getAttribute("data-grupo")), 0);
    const material = new THREE.MeshToonMaterial({ color: colorNucleo });
    let nucleo = new THREE.Mesh(geometry, material);
    nucleo.position.set(parent.x, parent.y, 0);
    nucleo.userData.draggable = true;
    scene.add(nucleo);

    elemento[nucleo.id] = child;

    if (Math.random() <= 0.5) {
        scene.getObjectById(nucleo.id).position.x += (Math.random() * parent.radioAtomico * 2);
        elemento[nucleo.id].x = scene.getObjectById(nucleo.id).position.x;
    } else {
        scene.getObjectById(nucleo.id).position.x -= (Math.random() * parent.radioAtomico * 2);
        elemento[nucleo.id].x = scene.getObjectById(nucleo.id).position.x;
    }

    if (Math.random() * 1 <= 0.5) {
        scene.getObjectById(nucleo.id).position.y += (Math.random() * parent.radioAtomico * 2);
        elemento[nucleo.id].y = scene.getObjectById(nucleo.id).position.y;
    } else {
        scene.getObjectById(nucleo.id).position.y -= (Math.random() * parent.radioAtomico * 2);
        elemento[nucleo.id].y = scene.getObjectById(nucleo.id).position.y;
    }

    let nombre = document.createElement("div");
    document.getElementsByTagName("body")[0].appendChild(nombre);
    nombre.setAttribute("id", nucleo.id);
    nombre.setAttribute("class", "nombre3D");
    nombre.innerHTML = target.getAttribute("data-simbolo") + "<sup>" + target.getAttribute("data-superindice") + "</sup>";
}

function elementoConfigE(electrones, oxidacion) {
    this.total = electrones;
    this.periodo = function (p) {
        let nivelE = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p", "6f", "7d", "7f"];
        let periodos = [0, 0, 0, 0, 0, 0, 0, 0];
        let electonesTotal = 0;

        for (let cont = 0; cont < nivelE.length; cont++) {
            let periodo = nivelE[cont].slice(0, 1);
            let letra = nivelE[cont].slice(1, 2);

            switch (letra) {
                case "s":
                    letra = 2;
                    break;

                case "p":
                    letra = 6;
                    break;

                case "d":
                    letra = 10;
                    break;

                case "f":
                    letra = 14;
                    break;
            }

            for (let cont2 = 0; cont2 < letra; cont2++) {
                electonesTotal++;
                periodos[periodo]++;

                if (electonesTotal >= electrones) {
                    cont = nivelE.length;
                    cont2 = letra;
                }
            }
        }

        return periodos[p];
    };

    let valencia = 1;
    for (let cont = 7; cont > 0; cont--) {
        if (this.periodo(cont) != 0) {
            valencia = this.periodo(cont);
            cont = 0;
        }
    }
    this.valencia = valencia;
    //debugger;
    let lewis = [];
    oxidacion = parseInt(oxidacion);
    if (oxidacion < 0) {
        oxidacion = oxidacion * -1;
    }
    let cont = (valencia - oxidacion) / 2;
    for (cont; cont >= 1; cont--) {
        lewis.push([true, true]);
    }
    for (oxidacion; oxidacion >= 1; oxidacion--) {
        lewis.push([true]);
    }
    this.lewis = lewis;
}

function toScreenPosition(obj, camera) {
    var vector = new THREE.Vector3();

    var widthHalf = 0.5 * parseInt(container.style.width);
    var heightHalf = 0.5 * parseInt(container.style.height);

    obj.updateMatrixWorld();
    vector.setFromMatrixPosition(obj.matrixWorld);
    vector.project(camera);

    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = - (vector.y * heightHalf) + heightHalf;

    return {
        x: vector.x,
        y: vector.y
    };
}

function calculateAttract() {
    const speed = 2;
    const minDistance = 250;

    attractions.forEach(item => {
        // Obtener posiciones de los objetos
        let pos1 = item.nucleo1.position;
        let pos2 = item.nucleo2.position;

        // Calcular la dirección del objeto 1 al objeto 2
        let direction = new THREE.Vector3().subVectors(pos2, pos1).normalize();

        // Calcular la distancia entre los objetos
        let distance = pos1.distanceTo(pos2);

        // Si la distancia es mayor que el mínimo, mover los objetos
        if (distance > minDistance) {
            let newPos1 = pos1.add(direction.clone().multiplyScalar(speed));
            let newPos2 = pos2.add(direction.clone().multiplyScalar(-speed));

            elemento[item.nucleo1.id].x = newPos1.x;
            elemento[item.nucleo1.id].y = newPos1.y;

            elemento[item.nucleo2.id].x = newPos2.x;
            elemento[item.nucleo2.id].y = newPos2.y;

            dummies[item.nucleo1.id].position.set(newPos1.x, newPos1.y, 0);
            dummies[item.nucleo2.id].position.set(newPos2.x, newPos2.y, 0);
        }
    });
}

export {
    gravedad, vida, onMouseMove, elemento, atomSelected, toScreenPosition, tiempo, oxi, descomponer,
    dummies, raycasterX, raycasterY, follow, relLink, objUpdate, calculateAttract
}