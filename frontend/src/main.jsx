import React from "react";
<<<<<<< HEAD
import ReactDOM from "react-dom/client";
=======
import { createRoot } from "react-dom/client";
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

<<<<<<< HEAD
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
=======
createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </BrowserRouter>
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
    </React.StrictMode>
);
