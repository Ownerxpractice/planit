public class SecureQRCode extends QRCode {
    @Override
    public void createQrCode() {
        this.imageURL = "https://secure.qr/image.png";
        System.out.println("Secure QR Code with encryption created.");
    }
}
