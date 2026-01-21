/**
 * リスク評価実験用 Google Apps Script
 * 
 * 使い方:
 * 1. Google Spreadsheet を新規作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードを貼り付け
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ を選択
 * 5. 次の設定でデプロイ:
 *    - 説明: Risk Assessment API
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 6. 生成されたウェブアプリURLを index.html の GAS_URL にペースト
 */

// ★★★ 設定 ★★★
// 画像を保存する親フォルダ名（Google Driveのルートに作成されます）
// このフォルダの中に参加者ごとのサブフォルダが自動作成されます
const ROOT_FOLDER_NAME = 'Advanced_robotics_2026/RiskAssessmentImages';

function doPost(e) {
  try {
    // JSONデータをパース
    const data = JSON.parse(e.postData.contents);
    
    // スプレッドシートを取得（アクティブなスプレッドシートを使用）
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('RiskAssessment');
    
    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet('RiskAssessment');
      // ヘッダー行を追加
      const headers = [
        'Timestamp',
        'Participant Name',
        'Image Path',
        'No Risk',
        'Fire Selected',
        'Burn Selected',
        'Ingestion Selected',
        'Fall Selected',
        'Damage Selected',
        'Cut Selected',
        'Fire Path',
        'Burn Path',
        'Ingestion Path',
        'Fall Path',
        'Damage Path',
        'Cut Path',
        'Annotated Image URL'
      ];
      sheet.appendRow(headers);
      
      // ヘッダー行をフリーズ
      sheet.setFrozenRows(1);
    }
    
    // タイムスタンプ
    const timestamp = new Date().toISOString();
    
    // 画像をDriveに保存（オプション）
    let imageUrl = '';
    if (data.imageDataUrl) {
      try {
        imageUrl = saveImageToDrive(data.imageDataUrl, data.participantName, data.imagePath);
      } catch (imgError) {
        console.error('Image save error:', imgError);
        imageUrl = 'Error saving image';
      }
    }
    
    // データ行を作成
    const row = [
      timestamp,
      data.participantName || '',
      data.imagePath || '',
      data.noRisk ? 1 : 0,
      data.risks?.fire?.selected ? 1 : 0,
      data.risks?.burn?.selected ? 1 : 0,
      data.risks?.ingestion?.selected ? 1 : 0,
      data.risks?.fall?.selected ? 1 : 0,
      data.risks?.damage?.selected ? 1 : 0,
      data.risks?.cut?.selected ? 1 : 0,
      JSON.stringify(data.risks?.fire?.path || []),
      JSON.stringify(data.risks?.burn?.path || []),
      JSON.stringify(data.risks?.ingestion?.path || []),
      JSON.stringify(data.risks?.fall?.path || []),
      JSON.stringify(data.risks?.damage?.path || []),
      JSON.stringify(data.risks?.cut?.path || []),
      imageUrl
    ];
    
    // データを追加
    sheet.appendRow(row);
    
    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 画像をGoogle Driveに保存
 * 親フォルダ（ROOT_FOLDER_NAME）の中に参加者ごとのサブフォルダを作成し、
 * そこに画像を保存します。
 * 
 * フォルダ構造:
 * ROOT_FOLDER_NAME/
 * ├── 参加者A/
 * │   ├── 画像1.png
 * │   └── 画像2.png
 * └── 参加者B/
 *     ├── 画像1.png
 *     └── 画像2.png
 */
function saveImageToDrive(dataUrl, participantName, imagePath) {
  // DataURLからBlobを作成
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType);
  
  // ファイル名を生成
  const imageFileName = imagePath.split('/').pop().replace(/\.\w+$/, '');
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  const fileName = `${imageFileName}_${timestamp}.png`;
  
  // 親フォルダを取得または作成（パス形式をサポート）
  // 例: 'Advanced_robotics_2026/RiskAssessmentImages' のようなネストされたパスもOK
  let rootFolder = getOrCreateFolderPath(ROOT_FOLDER_NAME);
  
  // 参加者名のサブフォルダを取得または作成
  // 参加者名が空の場合は 'anonymous' を使用
  const safeName = participantName ? sanitizeFolderName(participantName) : 'anonymous';
  let userFolder = getOrCreateFolder(rootFolder, safeName);
  
  // ファイルを保存
  blob.setName(fileName);
  const file = userFolder.createFile(blob);
  
  // 共有設定（リンクを知っている全員が閲覧可能）
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

/**
 * フォルダ名として使用できない文字を置換
 */
function sanitizeFolderName(name) {
  // Google Drive で使えない文字を置換（スラッシュは除外 - パス区切りとして使用）
  return name.replace(/[\\:*?"<>|]/g, '_').trim();
}

/**
 * パス形式のフォルダを取得または作成
 * 例: 'ParentFolder/ChildFolder/GrandChild' のようなパスを処理
 * @param {string} folderPath - スラッシュ区切りのフォルダパス
 * @returns {Folder} 最終的なフォルダオブジェクト
 */
function getOrCreateFolderPath(folderPath) {
  // パスをスラッシュで分割
  const pathParts = folderPath.split('/').filter(part => part.trim() !== '');
  
  if (pathParts.length === 0) {
    throw new Error('Invalid folder path');
  }
  
  // 最初のフォルダはルートから検索
  let currentFolder = getOrCreateFolder(null, pathParts[0]);
  
  // 残りのフォルダを順番に作成/取得
  for (let i = 1; i < pathParts.length; i++) {
    currentFolder = getOrCreateFolder(currentFolder, pathParts[i]);
  }
  
  return currentFolder;
}

/**
 * 指定されたフォルダ内にサブフォルダを取得または作成
 * @param {Folder|null} parentFolder - 親フォルダ（nullの場合はルート）
 * @param {string} folderName - 作成/取得するフォルダ名（スラッシュなし）
 * @returns {Folder} フォルダオブジェクト
 */
function getOrCreateFolder(parentFolder, folderName) {
  // フォルダ名をサニタイズ（スラッシュ以外の不正文字を除去）
  const safeFolderName = folderName.replace(/[\\:*?"<>|]/g, '_').trim();
  
  let folder;
  
  if (parentFolder === null) {
    // ルートレベルでフォルダを検索
    const folders = DriveApp.getFoldersByName(safeFolderName);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(safeFolderName);
    }
  } else {
    // 親フォルダ内でサブフォルダを検索
    const subFolders = parentFolder.getFoldersByName(safeFolderName);
    if (subFolders.hasNext()) {
      folder = subFolders.next();
    } else {
      folder = parentFolder.createFolder(safeFolderName);
    }
  }
  
  return folder;
}

/**
 * GETリクエスト用（テスト用）
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'ok', 
      message: 'Risk Assessment API is running',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}