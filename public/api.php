<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$uploadsDir = __DIR__ . '/uploads/portfolio';

// Assicuriamoci che la cartella base esista
if (!file_exists($uploadsDir)) {
    mkdir($uploadsDir, 0777, true);
}

switch ($action) {
    case 'getPortfolio':
        $categories = [];
        $imagesByCategory = [];
        $orderFile = $uploadsDir . '/categories_order.json';
        $customOrder = [];

        if (file_exists($orderFile)) {
            $customOrder = json_decode(file_get_contents($orderFile), true) ?: [];
        }

        if (is_dir($uploadsDir)) {
            $items = scandir($uploadsDir);
            foreach ($items as $item) {
                if ($item !== '.' && $item !== '..' && is_dir($uploadsDir . '/' . $item)) {
                    $categoryName = $item;
                    $categories[] = $categoryName;
                    $catId = strtolower(preg_replace('/\s+/', '', $categoryName));
                    
                    $imagesByCategory[$catId] = [];
                    
                    $catPath = $uploadsDir . '/' . $categoryName;
                    $files = scandir($catPath);
                    foreach ($files as $file) {
                        if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $file)) {
                            // The URL path relative to the domain
                            $imagesByCategory[$catId][] = '/uploads/portfolio/' . rawurlencode($categoryName) . '/' . rawurlencode($file);
                        }
                    }
                }
            }
        }
        
        // Sort categories based on customOrder
        if (!empty($customOrder)) {
            usort($categories, function($a, $b) use ($customOrder) {
                $posA = array_search($a, $customOrder);
                $posB = array_search($b, $customOrder);
                if ($posA === false) $posA = 9999;
                if ($posB === false) $posB = 9999;
                return $posA - $posB;
            });
        }
        
        echo json_encode([
            "categories" => $categories,
            "imagesByCategory" => $imagesByCategory
        ]);
        break;

    case 'reorderCategories':
        $data = json_decode(file_get_contents('php://input'), true);
        $order = isset($data['order']) ? $data['order'] : [];
        if (!empty($order)) {
            file_put_contents($uploadsDir . '/categories_order.json', json_encode($order));
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Ordine non valido"]);
        }
        break;

    case 'getServices':
        $servicesFile = __DIR__ . '/uploads/services.json';
        if (file_exists($servicesFile)) {
            echo file_get_contents($servicesFile);
        } else {
            echo json_encode(["it" => [], "en" => []]);
        }
        break;

    case 'saveServices':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['services'])) {
            file_put_contents(__DIR__ . '/uploads/services.json', json_encode($data['services'], JSON_PRETTY_PRINT));
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dati mancanti"]);
        }
    case 'getConfig':
        $configFile = __DIR__ . '/uploads/config.json';
        if (file_exists($configFile)) {
            echo file_get_contents($configFile);
        } else {
            echo json_encode(["pageMode" => "chisiamo"]);
        }
        break;

    case 'saveConfig':
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['config'])) {
            file_put_contents(__DIR__ . '/uploads/config.json', json_encode($data['config'], JSON_PRETTY_PRINT));
            echo json_encode(["success" => true]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Dati mancanti"]);
        }
        break;


    case 'createCategory':
        $data = json_decode(file_get_contents('php://input'), true);
        $name = isset($data['name']) ? trim($data['name']) : '';
        
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["error" => "Nome categoria mancante"]);
            exit;
        }

        $catPath = $uploadsDir . '/' . $name;
        if (!file_exists($catPath)) {
            mkdir($catPath, 0777, true);
            echo json_encode(["success" => true, "message" => "Categoria creata"]);
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Categoria già esistente"]);
        }
        break;

    case 'deleteCategory':
        $name = isset($_GET['name']) ? trim($_GET['name']) : '';
        $catPath = $uploadsDir . '/' . $name;
        
        if (file_exists($catPath) && is_dir($catPath)) {
            // Delete all files inside first
            $files = array_diff(scandir($catPath), array('.','..')); 
            foreach ($files as $file) { 
                unlink("$catPath/$file"); 
            } 
            rmdir($catPath);
            echo json_encode(["success" => true, "message" => "Categoria eliminata"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Categoria non trovata"]);
        }
        break;

    case 'uploadImage':
        $category = isset($_POST['category']) ? trim($_POST['category']) : 'Uncategorized';
        $catPath = $uploadsDir . '/' . $category;
        
        if (!file_exists($catPath)) {
            mkdir($catPath, 0777, true);
        }

        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES['photo']['tmp_name'];
            $fileName = time() . '-' . preg_replace('/\s+/', '_', $_FILES['photo']['name']);
            $destination = $catPath . '/' . $fileName;
            
            if (move_uploaded_file($tmpName, $destination)) {
                echo json_encode([
                    "success" => true, 
                    "url" => '/uploads/portfolio/' . rawurlencode($category) . '/' . rawurlencode($fileName)
                ]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Errore durante il salvataggio del file"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["error" => "Nessun file caricato o errore nell'upload"]);
        }
        break;

    case 'deleteImage':
        $data = json_decode(file_get_contents('php://input'), true);
        $url = isset($data['url']) ? $data['url'] : '';
        
        if (empty($url)) {
            http_response_code(400);
            echo json_encode(["error" => "URL mancante"]);
            exit;
        }

        // Convert URL (e.g. /uploads/portfolio/Eventi/123.jpg) back to absolute path
        $relativePath = urldecode(preg_replace('/^\/uploads\//', '', $url));
        $absolutePath = __DIR__ . '/uploads/' . $relativePath;
        
        if (file_exists($absolutePath) && !is_dir($absolutePath)) {
            unlink($absolutePath);
            echo json_encode(["success" => true, "message" => "Immagine eliminata"]);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Immagine non trovata sul server"]);
        }
        break;

    case 'trackPing':
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true) ?: [];
        $sessionId = isset($data['sessionId']) ? trim($data['sessionId']) : '';
        
        if (empty($sessionId)) {
            http_response_code(400);
            echo json_encode(["error" => "Session ID mancante"]);
            exit;
        }

        $activeFile = __DIR__ . '/uploads/analytics_active.json';
        $historyFile = __DIR__ . '/uploads/analytics_history.json';
        $now = time();

        // Helper to get client IP
        $ip = '127.0.0.1';
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            $ip = trim($parts[0]);
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }

        $activeSessions = file_exists($activeFile) ? (json_decode(file_get_contents($activeFile), true) ?: []) : [];
        $history = file_exists($historyFile) ? (json_decode(file_get_contents($historyFile), true) ?: []) : [];

        // 1. Clean up stale active sessions (> 45s without ping)
        $updatedActive = [];
        foreach ($activeSessions as $sid => $sess) {
            if ($now - ($sess['lastPing'] ?? 0) > 45) {
                // Mark as ended in history
                foreach ($history as &$hItem) {
                    if ($hItem['sessionId'] === $sid && ($hItem['status'] ?? '') === 'online') {
                        $hItem['status'] = 'ended';
                        $hItem['endTime'] = $sess['lastPing'];
                        $hItem['durationSeconds'] = max(1, $sess['lastPing'] - $sess['firstSeen']);
                        break;
                    }
                }
            } else {
                $updatedActive[$sid] = $sess;
            }
        }

        // 2. Update or insert current session
        $page = isset($data['page']) ? $data['page'] : '/';
        $referrer = isset($data['referrer']) && !empty($data['referrer']) ? $data['referrer'] : 'Diretto';
        $deviceType = isset($data['deviceType']) ? $data['deviceType'] : 'Desktop';
        $os = isset($data['os']) ? $data['os'] : 'Unknown OS';
        $browser = isset($data['browser']) ? $data['browser'] : 'Unknown Browser';
        $screen = isset($data['screen']) ? $data['screen'] : '';
        $language = isset($data['language']) ? $data['language'] : 'it';
        $theme = isset($data['theme']) ? $data['theme'] : 'dark';
        $visitorId = isset($data['visitorId']) ? $data['visitorId'] : $sessionId;

        if (isset($updatedActive[$sessionId])) {
            $existing = $updatedActive[$sessionId];
            $pages = $existing['pages'] ?? [];
            if (empty($pages) || end($pages) !== $page) {
                $pages[] = $page;
            }
            $updatedActive[$sessionId] = array_merge($existing, [
                'currentPage' => $page,
                'lastPing' => $now,
                'pageViews' => count($pages),
                'pages' => $pages,
                'theme' => $theme,
                'language' => $language
            ]);
        } else {
            $updatedActive[$sessionId] = [
                'sessionId' => $sessionId,
                'visitorId' => $visitorId,
                'ip' => $ip,
                'deviceType' => $deviceType,
                'os' => $os,
                'browser' => $browser,
                'screen' => $screen,
                'currentPage' => $page,
                'referrer' => $referrer,
                'language' => $language,
                'theme' => $theme,
                'firstSeen' => $now,
                'lastPing' => $now,
                'pageViews' => 1,
                'pages' => [$page]
            ];
        }

        // 3. Update or insert in history log
        $foundInHistory = false;
        foreach ($history as &$hItem) {
            if ($hItem['sessionId'] === $sessionId) {
                $foundInHistory = true;
                $hPages = $hItem['pages'] ?? [];
                if (empty($hPages) || end($hPages) !== $page) {
                    $hPages[] = $page;
                }
                $hItem['lastPage'] = $page;
                $hItem['pageViews'] = count($hPages);
                $hItem['pages'] = $hPages;
                $hItem['endTime'] = $now;
                $hItem['durationSeconds'] = max(1, $now - $hItem['startTime']);
                $hItem['status'] = 'online';
                $hItem['theme'] = $theme;
                $hItem['language'] = $language;
                break;
            }
        }

        if (!$foundInHistory) {
            $newHistoryItem = [
                'sessionId' => $sessionId,
                'visitorId' => $visitorId,
                'ip' => $ip,
                'deviceType' => $deviceType,
                'os' => $os,
                'browser' => $browser,
                'screen' => $screen,
                'landingPage' => $page,
                'lastPage' => $page,
                'pageViews' => 1,
                'pages' => [$page],
                'referrer' => $referrer,
                'language' => $language,
                'theme' => $theme,
                'startTime' => $now,
                'endTime' => $now,
                'durationSeconds' => 1,
                'status' => 'online'
            ];
            array_unshift($history, $newHistoryItem);
            if (count($history) > 1500) {
                $history = array_slice($history, 0, 1500);
            }
        }

        file_put_contents($activeFile, json_encode($updatedActive, JSON_PRETTY_PRINT));
        file_put_contents($historyFile, json_encode($history, JSON_PRETTY_PRINT));

        echo json_encode([
            "success" => true,
            "activeCount" => count($updatedActive)
        ]);
        break;

    case 'trackLeave':
        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true) ?: [];
        $sessionId = isset($data['sessionId']) ? trim($data['sessionId']) : '';

        if (!empty($sessionId)) {
            $activeFile = __DIR__ . '/uploads/analytics_active.json';
            $historyFile = __DIR__ . '/uploads/analytics_history.json';
            $now = time();

            if (file_exists($activeFile)) {
                $activeSessions = json_decode(file_get_contents($activeFile), true) ?: [];
                if (isset($activeSessions[$sessionId])) {
                    unset($activeSessions[$sessionId]);
                    file_put_contents($activeFile, json_encode($activeSessions, JSON_PRETTY_PRINT));

                    if (file_exists($historyFile)) {
                        $history = json_decode(file_get_contents($historyFile), true) ?: [];
                        foreach ($history as &$hItem) {
                            if ($hItem['sessionId'] === $sessionId) {
                                $hItem['status'] = 'ended';
                                $hItem['endTime'] = $now;
                                $hItem['durationSeconds'] = max(1, $now - $hItem['startTime']);
                                break;
                            }
                        }
                        file_put_contents($historyFile, json_encode($history, JSON_PRETTY_PRINT));
                    }
                }
            }
        }
        echo json_encode(["success" => true]);
        break;

    case 'getAnalytics':
        $activeFile = __DIR__ . '/uploads/analytics_active.json';
        $historyFile = __DIR__ . '/uploads/analytics_history.json';
        $now = time();

        $activeSessions = file_exists($activeFile) ? (json_decode(file_get_contents($activeFile), true) ?: []) : [];
        $history = file_exists($historyFile) ? (json_decode(file_get_contents($historyFile), true) ?: []) : [];

        // Clean stale sessions (> 45s without ping)
        $cleanActive = [];
        $historyModified = false;
        foreach ($activeSessions as $sid => $sess) {
            if ($now - ($sess['lastPing'] ?? 0) > 45) {
                foreach ($history as &$hItem) {
                    if ($hItem['sessionId'] === $sid && ($hItem['status'] ?? '') === 'online') {
                        $hItem['status'] = 'ended';
                        $hItem['endTime'] = $sess['lastPing'];
                        $hItem['durationSeconds'] = max(1, $sess['lastPing'] - $sess['firstSeen']);
                        $historyModified = true;
                        break;
                    }
                }
            } else {
                $cleanActive[$sid] = $sess;
            }
        }

        if (count($cleanActive) !== count($activeSessions)) {
            file_put_contents($activeFile, json_encode($cleanActive, JSON_PRETTY_PRINT));
        }
        if ($historyModified) {
            file_put_contents($historyFile, json_encode($history, JSON_PRETTY_PRINT));
        }

        // Calculate aggregated statistics
        $todayStart = strtotime('today midnight');
        $totalVisits = count($history);
        $todayVisits = 0;
        $totalDuration = 0;
        $deviceBreakdown = ['Desktop' => 0, 'Mobile' => 0, 'Tablet' => 0];
        $pageCounts = [];

        foreach ($history as $h) {
            if (($h['startTime'] ?? 0) >= $todayStart) {
                $todayVisits++;
            }
            $totalDuration += ($h['durationSeconds'] ?? 0);
            
            $dev = $h['deviceType'] ?? 'Desktop';
            if (isset($deviceBreakdown[$dev])) {
                $deviceBreakdown[$dev]++;
            } else {
                $deviceBreakdown['Desktop']++;
            }

            $landing = $h['landingPage'] ?? '/';
            $pageCounts[$landing] = ($pageCounts[$landing] ?? 0) + 1;
        }

        arsort($pageCounts);

        $avgDuration = $totalVisits > 0 ? round($totalDuration / $totalVisits) : 0;

        echo json_encode([
            "activeVisitors" => array_values($cleanActive),
            "history" => $history,
            "stats" => [
                "activeCount" => count($cleanActive),
                "totalVisits" => $totalVisits,
                "todayVisits" => $todayVisits,
                "avgDurationSeconds" => $avgDuration,
                "deviceBreakdown" => $deviceBreakdown,
                "topPages" => $pageCounts
            ]
        ]);
        break;

    case 'clearAnalyticsHistory':
        $historyFile = __DIR__ . '/uploads/analytics_history.json';
        file_put_contents($historyFile, json_encode([], JSON_PRETTY_PRINT));
        echo json_encode(["success" => true, "message" => "Cronologia azzerata con successo"]);
        break;

    case 'verifyPassword':
        $data = json_decode(file_get_contents('php://input'), true);
        $pwd = isset($data['password']) ? $data['password'] : '';
        if ($pwd === 'fotoextracolor@100') {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Password errata']);
        }
        break;

    case 'getChats':
        $chatsFile = __DIR__ . '/uploads/chatbot_sessions.json';
        if (file_exists($chatsFile)) {
            $chatsData = json_decode(file_get_contents($chatsFile), true) ?: [];
            $chatsArray = array_values($chatsData);
            usort($chatsArray, function($a, $b) {
                return strtotime($b['startTime']) - strtotime($a['startTime']);
            });
            echo json_encode(['success' => true, 'chats' => $chatsArray]);
        } else {
            echo json_encode(['success' => true, 'chats' => []]);
        }
        break;

    case 'chat':
        $data = json_decode(file_get_contents('php://input'), true);
        $userMessage = isset($data['message']) ? $data['message'] : '';
        $history = isset($data['history']) ? $data['history'] : [];
        $userName = isset($data['userName']) ? $data['userName'] : 'Utente';
        $sessionId = isset($data['sessionId']) ? $data['sessionId'] : (string)time();

        if (empty($userMessage)) {
            http_response_code(400);
            echo json_encode(['error' => 'Messaggio vuoto']);
            break;
        }

        $systemPrompt = "Sei l'assistente virtuale di Foto Extracolor, uno storico studio fotografico a Salerno (Via Raffaele Ricci 62, aperto dal Lunedì al Sabato).
Stai parlando con un cliente che si chiama: {$userName}.
Sei gentile, empatico e professionale. Usa il suo nome ogni tanto per rendere la conversazione più personale.
Servizi offerti: Stampa foto e fine art, sviluppo rullini, gadget personalizzati, servizi fotografici per matrimoni ed eventi, riprese con drone 4K, restauro vecchie foto, scansione pellicole antiche e conversione di videocassette (VHS) in formato digitale su pennetta USB.
Storia: Il negozio esiste da oltre 60 anni. È stato fondato da Riccardo Capasso e sua moglie Gabriela Donadio. Oggi il team include anche Annalisa, Chiara e Carmen Capasso.
Caratteristica principale: Tutto viene stampato e lavorato nel laboratorio interno artigianale per la massima qualità.
Contatti:
- Indirizzo: Via Raffaele Ricci 62, Salerno
- Email: info@fotoextracolor.com
- WhatsApp / Telefono: +39 3246687521

Regole per te:
- Rispondi in modo conciso e molto amichevole (massimo 2-3 brevi frasi).
- Se ti chiedono i contatti (email, telefono, indirizzo), fornisci le informazioni elencate sopra.
- Se ti chiedono un servizio che non facciamo, dì gentilmente che non lo offriamo.
- Se chiedono i prezzi, invita l'utente a scriverci su WhatsApp o a venire in negozio, poiché i prezzi dipendono dalle quantità e dal formato.
- Parla sempre in italiano.";

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt]
        ];
        foreach ($history as $h) {
            $messages[] = $h;
        }
        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $groqPayload = [
            'model' => 'qwen/qwen3.8-27b',
            'messages' => $messages,
            'temperature' => 0.7,
            'max_tokens' => 150
        ];

        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($groqPayload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer INSERISCI_QUI_LA_TUA_CHIAVE'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            $groqData = json_decode($response, true);
            if (isset($groqData['choices'][0]['message']['content'])) {
                $reply = $groqData['choices'][0]['message']['content'];

                // Salva su JSON
                $chatsFile = __DIR__ . '/uploads/chatbot_sessions.json';
                $chatsData = [];
                if (file_exists($chatsFile)) {
                    $chatsData = json_decode(file_get_contents($chatsFile), true) ?: [];
                }

                if (!isset($chatsData[$sessionId])) {
                    $chatsData[$sessionId] = [
                        'sessionId' => $sessionId,
                        'userName' => $userName,
                        'startTime' => date('c'),
                        'messages' => []
                    ];
                }

                $chatsData[$sessionId]['messages'][] = ['sender' => 'user', 'text' => $userMessage, 'timestamp' => date('c')];
                $chatsData[$sessionId]['messages'][] = ['sender' => 'bot', 'text' => $reply, 'timestamp' => date('c')];

                file_put_contents($chatsFile, json_encode($chatsData, JSON_PRETTY_PRINT));

                echo json_encode(['reply' => $reply]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Errore nella risposta di Groq']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Errore di comunicazione con AI', 'details' => $response]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Azione non valida"]);
        break;
}
?>
