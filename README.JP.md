# Ethertip
This is ether tipping system on Slack.Using ERC725/ERC735 for Authentication.

## 概要
Slack上でEtherを用いたtipが可能になる。  
以下に構成図を載せる。
![ethertip_architecture](https://user-images.githubusercontent.com/42530222/47830338-d452d580-ddce-11e8-88d2-7dafb8ce62f7.png)

## 導入方法
### ローカル
このリポジトリをcloneする。
`npm install`コマンドを実行して、package.jsonの中身を再現。
`npm run start`でローカルで動かすことができる。

### AWS
**IAMユーザ**  
IAMユーザを作成して以下の権限を付与してする。
- AWSLambdaFullAccess

- AmazonS3FullAccess

- AmazonDynamoDBFullAccess

- AmazonAPIGatewayAdministrator

- AWSKeyManagementServicePowerUser

これらの権限を付与したら、アクセスキーを生成しておく。


**IAMロール**  
IAMロールを作成して以下の権限を付与してする。
- AmazonDynamoDBFullAccess

- CloudWatchLogsFullAccess

- AmazonAPIGatewayAdministrator

- AWSLambdaBasicExecutionRole

- AWSKeyManagementServicePowerUser

#### Lambda
10MBを超えるファイルはLambdaに直接アップロードすることができないため、一度S3に置いてからLambdaへアップロードする。staticフォルダはS3に設置するので除外しておく。
app.jsにある`/withdraw`コマンドを定義しているにあるURLを変更する。
```
bot.replyPublic(message,"You can withdraw your ether to " + user.address + " at below: " +
                    "https://S3にアップロードした静的ファイル/withdraw.html?id=" + message.user +
                    "&value=" + user.tip +
                    "&sig=" + sig);
```

cloneしたディレクトリで以下のコマンドを実行。  
`zip -r ../適当な名前.zip *`

S3に適当な名前のバケットを作ってzipファイルをアップロードしておく。

Lambda関数は『一から関数を作る』を選択し、先ほど作成したロールを割り当てて作成する。

#### lambdaの環境変数

-   clientId : SlackappのclientId
-   clientSecret : SlackappのclientSecret
-   PORT: localhostのポート番号
-   EXPRESS_AWS_REGION : リージョン情報
-   EXPRESS_AWS_ACCESS_KEY_ID : IAMユーザのアクセスキー
-   EXPRESS_AWS_SECRET_ACCESS_KEY: IAMユーザのアクセスキー
-   PRIV_KEY : コントラクトの秘密鍵


#### API Gateway

**メソッドの追加**
- メソッド : ANY  
統合タイプ : Lambda関数  
Lambda統合プロキシの使用にチェックを入れる。
作成したLambda関数を設定する。

- メソッド : OPTIONS  
Mockを選択。

**リソースの追加**  
`リソースの作成`から`プロキシリソースとして設定`を選択。
`API Gateway CORSを有効化する`にチェックを入れる。

<img width="1089" alt="api_gateway" src="https://user-images.githubusercontent.com/42530222/47829257-c6e71c80-ddc9-11e8-8a39-b78c2e3b9091.png">

**CORSの有効化**  
API Gatewayからそれぞれのリソースに対してCORSを有効化しておく。

**デプロイする**  
設定が完了したら、アクションからAPIをデプロイしておく。

#### DynamoDB
`テーブルの作成`から`botkit`という名前のテーブルを作成する。  
Primary partition key: type (String)  
Primary sort key: id (String)  

#### 静的ファイルをS3に置く
cloneしたディレクトリの中にある`static`フォルダの中身をS3にアップロードする。  
その際、add()内にあるurlをAPI Gatewayのエンドポイントにしておく。

```
function add() {
    userRegistoryInstance.users(userAccount, function (err, result) {
        $.ajax({
            method: 'POST',
            url: 'https://API_Gatewayのエンドポイント' + 'add',
```

### Slack
-   [https://api.slack.com/apps/](https://api.slack.com/apps/)  でアプリを作成。
-   『Add bot user』からbotを作成。

**イベント**  
Request URL : https://APIGatewayのエンドポイント/slack/receive

Subscribe to Workspace Events
- reaction_added

**コマンド**  
Request URL : https://APIGatewayのエンドポイント/slack/receive

- /wallet  ウォレットアドレスと自分のtip状況を確認する
- /register  ウォレットアドレスの登録
- /withdraw  tipで溜まったEtherを引き出す

**OAuth & Permissions**  
Set Oauth address  
Redirect URLs : https://APIGatewayのエンドポイント/oauth

これらの設定が終わったら、『Install App』からアプリをインストールする。  
さらに、botkitにSlackの認証情報を持たせるために、以下のURLにアクセスする。  
https://APIGatewayのエンドポイント/login

ここまでが正しく行われていれば、DynamoDBに`teams`の書き込みがあるはず。

## 秘密鍵の用意
2つのEthereum Walletの秘密鍵を用意する必要がある。

### 1.Ethertipのvalidetor
この秘密鍵をTipサービスのサーバー内においておく。
この秘密鍵に紐づくWallet addressをTipのValidatorに設定しておく。

Withdrawコマンドを実行した際に秘密鍵を使って署名を行い、コントラクト内でWallet Addressを復元しvalidatorと照会し、署名が正しいか確認する。

### 2.Identity認証のClaimSigner
この秘密鍵を認証サービスのサーバー内においておく必要があるので、この秘密鍵に紐づくWallet addressのkeccak256をClaimIssuerのClaimSignerKeyに設定しておく。
認証を行った際に、秘密鍵を使って署名を行い、コントラクト内でWallet AddressのKeccak256を復元しClaimSignerと紹介し、署名が正しいか確認する。

## コントラクトのデプロイ
### Identity
1. contracts/UserRegistory.solをデプロイ
2. Identity.solをデプロイするときに、デプロイしたUserRegistoryのaddressをコンストラクタのパラメータとして設定する

### ClaimIssuer
1. デプロイ
2. 秘密鍵に紐づくClaimSignerを設定

### Tip
1. デプロイする時のコンストラクタのパラメータに上記の秘密鍵に紐づくValidatorを設定しておく
2. デプロイしたコントラクトにEtherを送金する

### バグやエラーの対処
バグが出てそうな箇所を特定して、logに出力させる。
logはCloudWatchで確認することができる。

## 使い方
- 相手にtipを送りたいとき  
`moneybag`スタンプを相手に送る。

- 自分のtip数を確認したいとき  
`/wallet`コマンドで確認することができる。

- walletを登録したいとき  
`/registe 自分のウォレットアドレス`でaddressを登録する。

- 溜まったtipを引き出したいとき  
`/withdraw`コマンドを実行する

### 溜まったEthereumを引き出す
`/withdraw`コマンドで引き出すことができるが、少し準備が必要になる。

#### Metamaskの導入
Ethereumを使うにはwallet addressが必要。  
MetaMaskを使うとaddressを簡単に取得できる。  
https://metamask.io/

#### テストネットでEtherを取得する
Ethereumでトランザクションを行うにはガスという手数料を払う必要がある。そのためにEtherを取得する必要がある。
現段階ではテストネットという開発用のネットワークを使うので、実際の費用がかかるわけではない。

今回使用しているのはRinkebyというテストネット。  
https://www.rinkeby.io/#stats

テストネットでのEtherの取得方法は以下のページを参考になる。  
https://tech.nerune.co/blockchain/faucet-eth/

#### Identityを生成する
以下のページからIdentityを生成する。  
https://S3に置いた静的ファイルのリンク/register.html  
`Create Identity`を押すとMetamaskに飛ぶのでガス代を設定して`確認`を押す。(ガス代をケチりすぎるとCONFIRMEDまで時間がかかる)

#### 認証を行う
`Identity`を生成すると`Email`と`Password`を入力する項目が出る。適当な値を入力して`Add Claim`を押す。すると、Metamaskに飛ぶので適当なガス代を払って、確認を押す。
トランザクションが`COMFIRMED` になったら、`Verify`をクリックして緑のチェックが出れば認証が完了している。

#### 溜まったEtherを引き出す
認証が完了している状態で`/withdraw`コマンドを叩いて、botから帰ってくるリンクを踏んで引き出す用のページに移動する。
`withdraw`ボタンから溜まったEtherを引き出すことができる。

## LICENSE
Copyright 2018 Lancers, Inc.

Licensed under the MIT License.
