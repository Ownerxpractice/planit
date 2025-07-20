public class BookingClass {
    private String url;
    private String confirmationCode;
    private String expirationDate;

    public BookingClass(String url, String code, String expirationDate) {
        this.url = url;
        this.confirmationCode = code;
        this.expirationDate = expirationDate;
    }

    public String generateLink() {
        return url + "?code=" + confirmationCode;
    }

    // Factory Method used 
    public QRCode generateQRCode(String type) {
        QRCode qr;
        if (type.equalsIgnoreCase("secure")) {
            qr = new SecureQRCode();
        } else {
            qr = new BasicQRCode();
        }
        qr.createQrCode();
        return qr;
    }
}
