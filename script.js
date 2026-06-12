/*
███████╗██╗   ██╗███████╗███╗   ██╗████████╗    ██╗  ██╗ █████╗ ███╗   ██╗██████╗ ██╗     ███████╗██████╗ ███████╗
██╔════╝██║   ██║██╔════╝████╗  ██║╚══██╔══╝    ██║  ██║██╔══██╗████╗  ██║██╔══██╗██║     ██╔════╝██╔══██╗██╔════╝
█████╗  ██║   ██║█████╗  ██╔██╗ ██║   ██║       ███████║███████║██╔██╗ ██║██║  ██║██║     █████╗  ██████╔╝███████╗
██╔══╝  ╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║       ██╔══██║██╔══██║██║╚██╗██║██║  ██║██║     ██╔══╝  ██╔══██╗╚════██║
███████╗ ╚████╔╝ ███████╗██║ ╚████║   ██║       ██║  ██║██║  ██║██║ ╚████║██████╔╝███████╗███████╗██║  ██║███████║
╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝
*/

/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗     ██╗
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ███║
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║    ╚██║
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║     ██║
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║     ██║
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝     ╚═╝
*/

/**
 * 1) Dès que le DOM est chargé, on gère le submit du form1.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Form1 : extraction de l'analytics CSV
    document.getElementById('form1').addEventListener('submit', async (event) => {
        event.preventDefault();

        const analyticsApiKey = document.getElementById('analyticsApiKey').value;
        const applicationId = document.getElementById('applicationId').value;
        const indexName = document.getElementById('indexName').value;
        const debugMode = document.getElementById('debugModeCheckbox').checked;

        // L'App ID et l'index sont toujours nécessaires (la Section 2 les relit) ;
        // la clé Analytics ne l'est pas en debug mode (pas d'appel API)
        if (!applicationId || !indexName || (!debugMode && !analyticsApiKey)) {
            showError('output1', 'Please fill in the Application ID, Index Name' + (debugMode ? '' : ' and Analytics API Key') + ' before continuing.');
            return;
        }

        // Sauvegarde dans localStorage pour que Form2 puisse les relire
        localStorage.setItem('algoliaApplicationId', applicationId);
        localStorage.setItem('algoliaIndexName', indexName);
        
        // Optionnel : Start / End date
        const startDateValue = document.getElementById('startDate').value;
        const endDateValue = document.getElementById('endDate').value;

        console.log("Start Date:", startDateValue || "Not provided");
        console.log("End Date:", endDateValue || "Not provided");

        // Si debugMode => on saute l'appel API et on affiche direct la section 2
        if (debugMode) {
            document.getElementById('section2').style.display = 'block';
            document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Prépare la query string pour l'Analytics API
        let queryString = `index=${indexName}&limit=1000`;
        if (startDateValue) queryString += `&startDate=${startDateValue}`;
        if (endDateValue) queryString += `&endDate=${endDateValue}`;

        console.log("Final Query String:", queryString);

        // Affiche un loader
        document.getElementById('loadingMessage1').style.display = 'block';

        try {
            const endpoints = [
                'https://analytics.algolia.com',
                'https://analytics.de.algolia.com'
            ];

            let searchData = null;

            // On essaie chaque endpoint jusqu'à ce qu'on récupère des données
            for (let endpoint of endpoints) {
                console.log(`Trying endpoint: ${endpoint}`);
                const response = await fetch(`${endpoint}/2/searches?${queryString}`, {
                    headers: {
                        'X-Algolia-API-Key': analyticsApiKey,
                        'X-Algolia-Application-Id': applicationId
                    }
                });

                if (response.ok) {
                    searchData = await response.json();

                    if (searchData?.searches?.length > 0) {
                        console.log(`Data retrieved from endpoint: ${endpoint}`);
                        break; // Stop après une récup réussie
                    }
                }

                console.error(`API request failed or no data at endpoint: ${endpoint}`);
            }

            if (!searchData || !searchData.searches || searchData.searches.length === 0) {
                // Pas de data => On affiche un message d'erreur + lien
                document.getElementById('output1').style.display = 'block';
                document.getElementById('output1').innerHTML = `
                    <p>Analytics are empty or could not be retrieved. Alternatively, you can download the CSV directly from the Algolia dashboard.</p>
                    <a href="retrieve-analytics-csv-file-from-algolia-dashboard.jpg"
                        target="_blank" class="tooltip">
                        How to download from dashboard
                        <span class="tooltiptext">
                            <img src="retrieve-analytics-csv-file-from-algolia-dashboard.jpg"
                                alt="Instructions" style="max-width:200px;">
                        </span>
                    </a>
                `;
                document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });
                return;
            }

            // Convertit en CSV et affiche un aperçu de 10 lignes
            const csvData = convertToCSV(searchData.searches);
            const previewData = csvData.split('\n').slice(0, 11).join('\n');

            document.getElementById('output1').style.display = 'block';
            document.getElementById('output1').innerHTML = `
                <p>Preview of Top 10 Searches:</p>
                ${createPreviewTable(previewData)}
                <p>This is a preview of the first 10 lines. Download the full CSV file for complete data.</p>
            `;

            // Génère un nom de fichier
            const now = new Date();
            const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
            const filename = `top_searches_${dateTimeString}_${applicationId}_${indexName}.csv`;

            // Prépare un Blob pour le download CSV
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = filename;
            downloadLink.textContent = 'Download Full CSV File';
            document.getElementById('output1').appendChild(downloadLink);

            document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });

            // Après la section 1, on passe à la section 2
            document.getElementById('section2').style.display = 'block';
            document.getElementById('section2').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("An error occurred:", error);
            document.getElementById('output1').style.display = 'block';
            document.getElementById('output1').innerHTML = `<p>An error occurred while retrieving analytics data.</p>`;
            document.getElementById('output1').scrollIntoView({ behavior: 'smooth' });
        } finally {
            // On masque le loader
            document.getElementById('loadingMessage1').style.display = 'none';
        }
    });
});


/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗    ██████╗ 
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ╚════██╗
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║     █████╔╝
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║    ██╔═══╝ 
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║    ███████╗
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚══════╝
*/  

/**
 * 2) Form2 : lit un CSV (colonne "search"), interroge l'index pour chaque query, génère un JSON consolidé.
 */
document.getElementById('form2').addEventListener('submit', async (event) => {
    event.preventDefault();

    const loader = document.getElementById('loadingMessage2');

    // Récup des champs
    const searchApiKey = document.getElementById('searchApiKey').value;
    const numSearchesToProcess = Math.min(document.getElementById('numSearchesToProcess').value, 1000);
    const attributeToRetrieve = document.getElementById('attributeToRetrieve').value;
    const numResults = document.getElementById('numResults').value;
    const csvFile = document.getElementById('csvFile').files[0];

    // rulesContexts éventuels
    const rulesContextValue = document.getElementById('rulesContext').value;
    let rulesContexts = [];
    if (rulesContextValue) {
        rulesContexts = rulesContextValue.split(',').map(item => item.trim());
        console.log("Captured rulesContexts:", rulesContexts);
    }

    // On stocke l'attribut dans le localStorage
    localStorage.setItem('attributeToRetrieve', attributeToRetrieve);

    // On récupère l'appID et l'indexName
    const applicationId = localStorage.getItem('algoliaApplicationId');
    const indexName = localStorage.getItem('algoliaIndexName');

    if (!applicationId || !indexName) {
        showError('output2', 'Algolia Application ID or Index Name is missing. Please fill in Section 1 first (even when you already have your CSV file).');
        return;
    }

    if (!csvFile) {
        showError('output2', 'Please upload the CSV file containing your top searches.');
        return;
    }

    loader.textContent = 'Processing, Please wait...';
    loader.style.display = 'block';

    try {
        const csvData = await csvFile.text();

        // On utilise la fonction parseCSV 3-arguments (targetHeader = "search")
        const queries = parseCSV(csvData, "search", numSearchesToProcess);
        console.log("Extracted queries:", queries);

        if (queries.length === 0) {
            showError('output2', 'No queries found in the CSV file. Make sure it contains a "search" column.');
            return;
        }

        // UserToken
        let randomToken = Math.random().toString(36).substring(2, 15);
        let userToken = `analytics-analyzer-${randomToken}`;

        let results = [];
        let failedQueries = [];

        // Boucle sur chaque query
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            loader.textContent = `Processing query ${i + 1}/${queries.length}...`;

            let queryParams = {
                query: query,
                hitsPerPage: numResults,
                attributesToRetrieve: [attributeToRetrieve, 'objectID'],
                getRankingInfo: true,
                analytics: false,
                clickAnalytics: false,
                userToken: userToken
            };

            // Ajout du ruleContexts
            if (rulesContexts.length > 0) {
                queryParams['ruleContexts'] = rulesContexts;
            }

            let response = await fetch(`https://${applicationId}-dsn.algolia.net/1/indexes/${indexName}/query`, {
                method: 'POST',
                headers: {
                    'X-Algolia-API-Key': searchApiKey,
                    'X-Algolia-Application-Id': applicationId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(queryParams)
            });

            if (!response.ok) {
                console.error('Search API request failed for query:', query);
                failedQueries.push(query);
                continue;
            }

            let data = await response.json();

            // On met l'attribut (ex: inStock) + objectID
            let queryResults = data.hits.map(hit => ({
                [attributeToRetrieve]: getNestedAttribute(hit, attributeToRetrieve),
                objectID: hit.objectID
            }));

            results.push({ query: query, hits: queryResults });
        }

        if (results.length === 0) {
            showError('output2', `All ${queries.length} search requests failed. Check your Search API Key and try again.`);
            return;
        }

        // On formate en JSON
        const formattedJson = JSON.stringify(results, null, 2);

        // Nom de fichier
        const now = new Date();
        const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        const filename = `search_results_${dateTimeString}_${applicationId}_${indexName}.json`;

        // Création Blob => download
        const dataBlob = new Blob([formattedJson], { type: 'application/json' });
        const downloadUrl = window.URL.createObjectURL(dataBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        downloadLink.textContent = 'Download JSON File';

        // Avertissement si certaines requêtes ont échoué
        const failureWarning = failedQueries.length > 0
            ? `<p class="error">Warning: ${failedQueries.length} of ${queries.length} search requests failed and were skipped (see browser console for details).</p>`
            : '';

        // Preview (5 premiers items)
        let previewContent = JSON.stringify(results.slice(0, 5), null, 2);
        document.getElementById('output2').innerHTML = `
            ${failureWarning}
            <p>Preview of JSON File (first 5 entries):</p>
            <pre id="jsonPreview">${escapeHtml(previewContent)}</pre>
            <p>This is a preview. The full JSON file can be downloaded below.</p>
        `;
        document.getElementById('output2').appendChild(downloadLink);
        document.getElementById('output2').style.display = 'block';

        // Affiche la section 3
        document.getElementById('section3').style.display = 'block';
        document.getElementById('section3').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("An error occurred:", error);
        showError('output2', `An error occurred during hits extraction: ${error.message}`);
    } finally {
        loader.style.display = 'none';
    }
});

/**
 * parseCSV avec 3 arguments : csvData, targetHeader et maxRows
 * Extrait la colonne dont le header = targetHeader, et ne dépasse pas maxRows lignes
 */
function parseCSV(csvData, targetHeader, maxRows) {
    const rows = parseCSVRows(csvData);
    if (rows.length === 0) return [];

    // Header matching insensible à la casse et aux espaces/BOM
    const headers = rows[0].map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());
    const targetIndex = headers.indexOf(targetHeader.toLowerCase());
    if (targetIndex === -1) {
        console.error(`Column "${targetHeader}" not found in the CSV headers.`);
        return [];
    }

    const queries = [];
    for (let i = 1; i < rows.length && queries.length < maxRows; i++) {
        const cell = rows[i][targetIndex];
        if (cell && cell.trim()) {
            queries.push(cell.trim());
        }
    }
    return queries;
}

/**
 * Parser CSV minimal : gère les champs entre guillemets (virgules, retours
 * à la ligne, guillemets doublés "") et les fins de ligne \r\n
 */
function parseCSVRows(csvData) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < csvData.length; i++) {
        const c = csvData[i];
        if (inQuotes) {
            if (c === '"') {
                if (csvData[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ',') {
            row.push(field);
            field = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && csvData[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += c;
        }
    }
    if (field !== '' || row.length > 0) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

/**
 * Récupère un attribut potentiellement nested depuis un objet
 */
function getNestedAttribute(obj, path) {
    return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : null, obj);
}


/*
███████╗███████╗ ██████╗████████╗██╗ ██████╗ ███╗   ██╗    ██████╗ 
██╔════╝██╔════╝██╔════╝╚══██╔══╝██║██╔═══██╗████╗  ██║    ╚════██╗
███████╗█████╗  ██║        ██║   ██║██║   ██║██╔██╗ ██║     █████╔╝
╚════██║██╔══╝  ██║        ██║   ██║██║   ██║██║╚██╗██║     ╚═══██╗
███████║███████╗╚██████╗   ██║   ██║╚██████╔╝██║ ╚████║    ██████╔╝
╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝ 
*/

/**
 * 3) Form3 : traite un JSON (issues de form2) pour calculer un pourcentage de hits ayant une valeur d'attribut
 */
document.getElementById('form3').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Fichier JSON + valeur de l'attribut
    const jsonFile = document.getElementById('jsonFile').files[0];
    const attributeValue = document.getElementById('attributeValue').value;
    const attributeToRetrieve = localStorage.getItem('attributeToRetrieve');

    if (!jsonFile) {
        showError('output3', 'Please upload the JSON file generated in Section 2.');
        return;
    }

    if (!attributeToRetrieve) {
        showError('output3', 'No attribute found. Please run Section 2 first so the tool knows which attribute to analyze.');
        return;
    }

    try {
        let jsonData;
        try {
            jsonData = JSON.parse(await jsonFile.text());
        } catch (parseError) {
            showError('output3', 'The uploaded file is not valid JSON. Please upload the file generated in Section 2.');
            return;
        }

        // On calcule le % de hits dont l'attribut = attributeValue
        const percentages = calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue);

        if (percentages.length === 0) {
            showError('output3', 'The JSON file contains no query results to analyze.');
            return;
        }

        // Convertir en CSV
        const csvData = convertToCSV(percentages);
        const previewData = csvData.split('\n').slice(0, 11).join('\n');

        // Affichage preview
        document.getElementById('output3').innerHTML = `
            <p>Preview of Analysis (first 10 lines):</p>
            ${createPreviewTable(previewData)}
            <p>This is a preview of the first 10 lines. The full CSV file can be downloaded below.</p>
        `;

        // Nom de fichier
        const now = new Date();
        const dateTimeString = now.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        const applicationId = localStorage.getItem('algoliaApplicationId');
        const indexName = localStorage.getItem('algoliaIndexName');
        const filename = `attribute_analysis_${dateTimeString}_${applicationId}_${indexName}.csv`;

        // Blob => Download
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = filename;
        downloadLink.textContent = 'Download Full CSV File';
        document.getElementById('output3').appendChild(downloadLink);

        // Scroll vers output3
        document.getElementById('output3').style.display = 'block';
        document.getElementById('output3').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error("An error occurred:", error);
        showError('output3', `An error occurred during the analysis: ${error.message}`);
    }
});

/**
 * Convert an array of objects into CSV format
 */
function convertToCSV(jsonData) {
    if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        console.log("No data to convert to CSV");
        return '';
    }

    // On récupère les colonnes (clés)
    const columns = Object.keys(jsonData[0]);
    console.log("CSV Columns:", columns);
    const csvColumns = columns.join(',');

    // Génération des lignes CSV
    const csvRows = jsonData.map(row => {
        return columns.map(fieldName => {
            // ?? et non || : 0 et false sont des valeurs légitimes
            let field = String(row[fieldName] ?? '');
            // Échapper si virgules / guillemets / newlines
            if (/[",\n\r]/.test(field)) {
                field = `"${field.replace(/"/g, '""')}"`;
            }
            return field;
        }).join(',');
    });

    return [csvColumns, ...csvRows].join('\n');
}

/**
 * Creates an HTML table as a preview of up to 10 rows of CSV data
 */
function createPreviewTable(csvData) {
    const rows = parseCSVRows(csvData);
    let html = '<table><thead><tr>';

    // En‐tête
    rows[0].forEach(header => {
        html += `<th>${escapeHtml(header)}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Lignes (max 10)
    for (let i = 1; i < Math.min(rows.length, 11); i++) {
        html += '<tr>';
        rows[i].forEach(col => {
            html += `<td>${escapeHtml(col)}</td>`;
        });
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

/**
 * Échappe les caractères HTML — les queries viennent d'utilisateurs finaux,
 * elles ne doivent jamais être injectées telles quelles dans le DOM
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Affiche un message d'erreur dans la zone d'output d'une section
 */
function showError(outputId, message) {
    const output = document.getElementById(outputId);
    output.style.display = 'block';
    output.innerHTML = `<p class="error">${escapeHtml(message)}</p>`;
    output.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Calculate the percentage of hits that match a specific attribute value
 */
function calculateAttributePercentage(jsonData, attributeToRetrieve, attributeValue) {
    let percentages = [];

    jsonData.forEach(queryObj => {
        let count = 0;

        queryObj.hits.forEach(hit => {
            let hitAttributeValue = String(hit[attributeToRetrieve]);
            if (hitAttributeValue === String(attributeValue)) {
                count += 1;
            }
        });

        const totalHits = queryObj.hits.length;
        // Une query sans hits donne 0%, pas NaN
        const percentage = totalHits > 0 ? (count / totalHits) * 100 : 0;
        percentages.push({
            query: queryObj.query,
            [`percentage of ${attributeToRetrieve} (${attributeValue})`]: percentage.toFixed(2),
            totalHits: totalHits
        });
    });

    return percentages;
}
