import express from "express";
import dotenv from "dotenv";
import scrapeRoutes from "./src/routes/scrape.routes";
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//health check
app.get("/", (req, res) => {
    res.send("SubSpy Server is running :!");
});

app.use("/api/v1", scrapeRoutes);

const PORT = process.env.PORT || 1010;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



