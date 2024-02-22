
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const {check, validationResult} = require('express-validator');
const db = require("./config/db.js");
const { ServerResponse } = require("http");
const cors = require("cors");

//Configuration
dotenv.config();

const server = express();


server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());


//Point d'accès 
server.use(express.static(path.join(__dirname, "public"))); 
server.use(express.json());
server.use(cors())

/**
 * @method get
 * @param 
 * Permet de récupérer la liste de tous les films
 */


server.get("/api/films",async (req, res)=>{
   
    try{
        
        const order = req.query["order"] || "asc"; 
        const tri = req.query["tri"] || "annee" ;
                  
        const donneesRef = await db.collection("film").orderBy(tri, order).get();
    
        const donneesFinale = [];
    
        donneesRef.forEach((doc)=>{
            donneesFinale.push(doc.data());
            
        
        });

      
    
            
        res.statusCode = 200;
        res.json(donneesFinale);

    } catch (erreur) {
        res.statusCode = 500;
        res.json({message : "une erreur est survenue"})
    }
    
   
   
});

/**
 * @method get
 * @param id
 * Permet d'acceder a un film
 */

server.get("/api/films/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const filmRef = await db.collection("film").doc(id).get();

        if (filmRef.exists) {
            const filmData = filmRef.data();
            res.statusCode = 200;
            res.json(filmData);
        } else {
            res.statusCode = 404;
            res.json({ message: "Film introuvable" });
        }

    } catch (erreur) {
        res.statusCode = 500;
        res.json({ message: "Une erreur est survenue" });
    }
});


/**
 * @method post
 * @param 
 * Permet d'ajouter un utlisateur
 */

server.post("/utlisateurs/inscription", 
[check('courriel').escape().trim().notEmpty().isEmail().normalizeEmail(), 
check('mdp').escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({
    minLength: 8,
    minLowercase:1,
    minUppercase:1,
    minNumbers:1,
    minSymbols:1

})],async (req,res)=>{

 // validation

    const validation = validationResult(req);

    if (validation.errors.length > 0 ) {

        res.statusCode = 400 ;
        return res.json({message: 'donnes non conformes'});
      
    }

    const {courriel , mdp} = req.body;

    const docRef = await db.collection('utlisateurs').where('courriel', '==', courriel).get();


    const utlisateurs = [];
    docRef.forEach((doc)=>{

        utlisateurs.push(doc.data());
        
    });

    if(utlisateurs.length > 0) {

        res.statusCode = 400;
        return res.json({message : 'ce courriel existe deja'}); 
    }


    const nouvelUtilisateur = {courriel, mdp}

    await db.collection('utlisateurs').add(nouvelUtilisateur);


    delete nouvelUtilisateur.mdp
    res.statusCode = 200;
    res.json(nouvelUtilisateur);
    

  
});


/**
 * @method post
 * @param 
 * Permet de connecter 
 */

server.post("/utlisateurs/connexion",async(req,res)=>{

    const {courriel , mdp} = req.body;

    const docRef = await db.collection('utlisateurs').where('courriel', '==', courriel).get();


    const utlisateurs = [];
    docRef.forEach((doc)=>{

        utlisateurs.push(doc.data());
        
    });

    if(utlisateurs.length == 0) {

        res.statusCode = 400;
        return res.json({message : 'ce courriel  n existe pas'}); 
    }

  
    const utilisateurAValider = utlisateurs[0];

    if (mdp !== utilisateurAValider.mdp) {

        res.statusCode = 400;
        return res.json({message : 'mot de passe incorrect'}); 
        
        
    }
    
    delete utilisateurAValider.mdp
    res.statusCode = 200;
    res.json({message : "connexion réussi" , utilisateur : utilisateurAValider });
 
});




/**
 * @method post
 * @param 
 * Permet d'ajouter tous les films de fichier filmTest.js
 */


server.post("/api/films/initialiser",(req,res)=>{

    const donneesTest = require("./data/filmsTest.js");

    donneesTest.forEach(async(element) => {

        await db.collection("film").add(element);

        res.statusCode = 200;
    
        res.json({
            message: "donnees initialisées",
        
    });

   
    });

});

/**
 * @method post
 * @param 
 * Permet d'ajouter un film
 */



server.post("/api/films",
[check('titre').escape().trim().notEmpty(),
check('genres').escape().trim().notEmpty().isArray(), 
check('description').escape().trim().notEmpty(),
check('annee').escape().trim().notEmpty().isInt(),
check('realisation').escape().trim().notEmpty(),
check('titreVignette').escape().trim().notEmpty(),
],async (req,res)=>{


    const validation = validationResult(req);

    if (validation.errors.length > 0 ) {

        res.statusCode = 400 ;
        return res.json({message: 'donnes non conformes'});
      
    }

 
    const test = req.body;

    if(test == undefined){
        res.statusCode = 404;
        return res.json({message: 'film pas trouve'});
        
    }

     await db.collection("film").add(test);

     res.statusCode = 201;
     res.json(test);

})


/**
 * @method put
 * @param 
 * Permet de modifier un film existant
 */



 server.put("/api/films/:id", async (req, res)=>{

    const id = req.params.id
    const donneesModif = req.body;

 
     await db.collection("film").doc(id).update(donneesModif);


     res.statusCode = 200;
     res.json({message: "la donnée a été modifiée"});

 })


 /**
 * @method delete
 * @param 
 * Permet de supprimer un film
 */


 server.delete("/api/films/:id", async (req, res) => {

    const id = req.params.id
    const resultat = await db.collection("film").doc(id).delete();
    res.status = 200;

    res.json("le document a ete supprime");

 })


// Gestion de la page 404 - requete non trouve

server.use((req, res)=>{
    res.statusCode = 404;
    res.render("404", { url: req.url })

});

server.listen(process.env.PORT, () =>{
    console.log("Le serveur a démarré")
})
