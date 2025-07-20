public class BasicQRCode extends QRCode {
    @Override
    public void createQrCode() {
        this.imageURL = "https://basic.qr/image.png";
        System.out.println("Basic QR Code created.");
    }
}
