

const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
// const mustacheExpress = require("mustache-express");
const db = require("./config/db.js");
const { ServerResponse } = require("http");

//Configuration
dotenv.config();

const server = express();
/////////////////////////

server.set("views", path.join(__dirname, "views"));
// server.set("view engine", "mustache");
// server.engine("mustache", mustacheExpress());

//Middlewares
//Doit etre avant la route - Point d'accès 
server.use(express.static(path.join(__dirname, "public"))); 
// permet d'accepter des body en Json dans les requetes 
server.use(express.json());

// Point d'accès
server.get("/api/films",async (req, res)=>{
   
    try{
        console.log(req.query);
        const direction = req.query["order-direction"] || "asc";
        const limit = +req.query["limit"] || 50 ;
    
        const donneesRef = await db.collection("film").orderBy("titre", direction).limit(limit).get();
    
        const donneesFinale = [];
    
        donneesRef.forEach((doc)=>{
            donneesFinale.push(doc.data());
            "<br>"
        
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
server.get("/api/films/:id", (req, res)=>{    
    //console.log(req.params.id);
   const donnees = require("./data/filmsTest.js");
   const film = donnees.find((element)=> {

    return element.id == req.params.id;
   });

   if(film) {

    res.statusCode = 200;
    res.json(film);

   }else{

    res.statusCode = 404;
    res.json({message: 'film non trouvee'});

   }
      
});

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

 server.post("/api/films", async (req, res)=>{

    const test = req.body;
    //validation des données
    if(test == undefined){
        res.statusCode = 404;
        return res.json({message: 'film pas trouve'});
        
    }

     await db.collection("film").add(test);

     res.statusCode = 201;
     res.json(test);

 })


//  server.put("/donnees/:id", async (req, res)=>{

//     const id = req.params.id
//     const donneesModif = req.body;

 
//      await db.collection("test").doc(id).update(donneesModif);


//      res.statusCode = 200;
//      res.json({message: "la donnée a été modifiée"});

//  })



 server.delete("/api/films/:id", async (req, res) => {

    const id = req.params.id
    const resultat = await db.collection("film").doc(id).delete();
    res.status = 200;

    res.json("le document a ete supprime");

 })

// Doit etre la dernière!!!
// Gestion de la page 404 - requete non trouve

server.use((req, res)=>{
    res.statusCode = 404;
    res.render("404", { url: req.url })

});

server.listen(process.env.PORT, () =>{
    console.log("Le serveur a démarré")
})
