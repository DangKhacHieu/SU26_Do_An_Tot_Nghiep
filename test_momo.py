import hmac
import hashlib
import json
import urllib.request
import uuid

accessKey = "M8brj9K6E22vXoDB"
secretKey = b"nqQiVSgDMy809JoPF6OzP5OdPdBPsoGQ"
partnerCode = "MOMO5RGX20191128"
ipnUrl = "https://your-ngrok-url/api/payments/momo/ipn"
redirectUrl = "http://localhost:5056/api/payments/momo/result"
orderInfo = "Thanh toan"
amount = "50000"
orderId = str(uuid.uuid4())
requestId = str(uuid.uuid4())
requestType = "captureWallet"
extraData = ""

rawSignature = f"accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}"
signature = hmac.new(secretKey, rawSignature.encode('utf-8'), hashlib.sha256).hexdigest()

data = {
    "partnerCode": partnerCode,
    "requestId": requestId,
    "amount": int(amount),
    "orderId": orderId,
    "orderInfo": orderInfo,
    "redirectUrl": redirectUrl,
    "ipnUrl": ipnUrl,
    "lang": "vi",
    "extraData": extraData,
    "requestType": requestType,
    "signature": signature
}

req = urllib.request.Request("https://test-payment.momo.vn/v2/gateway/api/create", data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))
