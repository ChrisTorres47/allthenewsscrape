var express = require("express")
var exphbs = require("express-handlebars")
var mongoose = require("mongoose")
var path = require("path")

var Note = require("./models/Note")
var Article = require("./models/Article")

var PORT = process.env.PORT || 8080
var app = express();
var routes = require("./routes")

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.use(express.static("public"));

app.use(routes);

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

app.get("/scrape", function(req,res){
    axios.get("https://www.nytimes.com/").then(function(response){
        var $ = cheerio.load(response.data)

        $("article").each(function(i, element){
          var result = {}

          summary = ""
          if ($(this).find("ul").length) {
            summary = $(this).find("li").first().text();
          } else {
            summary = $(this).find("p").text();
          };
          result.summary = summary
          result.title = $(this).find("h2").text()
          result.url = $(this).find("a href").text()

          db.Article.create(result)
          .then(function(dbArticle){
              console.log(dbArticle);
          })
          .catch(function(err){
              console.log(err)
          })

        })
        res.send("Scrape Complete")
    })
})
app.get("/articles", function(req, res) {
    db.Article.find({})
    .then(function(articles){
      res.json(articles)
    })
    .catch(function(err){
      res.json(err)
    })
  });

app.get("/articles/:id", function(req, res) {
    console.log(typeof(req.params.id))
    console.log(req.params.id)
    db.Article.findOne({_id: req.params.id }).populate("note")
    .then(function(article){
      res.json(article)
    }).catch(function(err){
      res.json(err)
    })
  });

  app.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbnote){
      return db.Article.findOneAndUpdate({_id: req.params.id}, {$set: { note: dbnote._id}}, {new: true})
    })
    .then(function(dbArticle){
      res.json(dbArticle)
    }).catch(function(err){
      res.json(err);
    })
  });
  
app.listen(PORT, function(){
    console.log("Listening on port" + PORT);
});