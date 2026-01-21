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
 */
function saveImageToDrive(dataUrl, participantName, imagePath) {
  // DataURLからBlobを作成
  const base64Data = dataUrl.split(',')[1];
  const mimeType = dataUrl.split(';')[0].split(':')[1];
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType);
  
  // ファイル名を生成
  const imageFileName = imagePath.split('/').pop().replace(/\.\w+$/, '');
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd_HHmmss');
  const fileName = `${participantName}_${imageFileName}_${timestamp}.png`;
  
  // フォルダを取得または作成
  let folder;
  const folderName = 'RiskAssessmentImages';
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  // ファイルを保存
  blob.setName(fileName);
  const file = folder.createFile(blob);
  
  // 共有設定（リンクを知っている全員が閲覧可能）
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
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
