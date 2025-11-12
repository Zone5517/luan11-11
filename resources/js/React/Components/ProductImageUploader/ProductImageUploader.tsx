import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";

interface ProductModel {
    id: number | string;
    [key: string]: any;
}

export interface ProductImageUploaderHandle {
    enabled(): void;
    disabled(): void;
}

interface Props {
    productModel: ProductModel;
}

const ProductImageUploader = forwardRef<ProductImageUploaderHandle, Props>(
    ({ productModel }, ref) => {
        const inputRef = useRef<HTMLInputElement | null>(null);
        const [isDisabled, setIsDisabled] = useState(false);
        const [loading, setLoading] = useState(false);
        const [success, setSuccess] = useState<string | null>(null);
        const [error, setError] = useState<string | null>(null);
        const [previewUrl, setPreviewUrl] = useState<string | null>(null);

        useImperativeHandle(
            ref,
            () => ({
                enabled() {
                    setIsDisabled(false);
                },
                disabled() {
                    setIsDisabled(true);
                },
            }),
            []
        );

        const getCsrfToken = () => {
            const el = document.querySelector(
                'meta[name="csrf-token"]'
            ) as HTMLMetaElement | null;
            return el?.content || "";
        };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSuccess(null);
            setError(null);
            const file = e.target.files?.[0];
            if (file) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        };

        const handleUpload = async () => {
            setSuccess(null);
            setError(null);

            const file = inputRef.current?.files?.[0];
            if (!file) {
                setError("Selecione um arquivo para envio.");
                return;
            }

            setLoading(true);
            try {
                const form = new FormData();
                form.append("image", file);

                const res = await fetch(`/api/products/${productModel.id}/image`, {
                    method: "POST",
                    body: form,
                    headers: {
                        // CSRF token (opcional, útil para apps Laravel)
                        "X-CSRF-TOKEN": getCsrfToken(),
                    },
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => null);
                    throw new Error(text || res.statusText || "Erro no servidor");
                }

                setSuccess("Upload realizado com sucesso.");
                setError(null);
            } catch (err: any) {
                setError(err?.message || "Erro ao enviar imagem.");
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="mb-3">
                {isDisabled && (
                    <div className="alert alert-secondary py-1 mb-2" role="alert">
                        Upload desabilitado
                    </div>
                )}

                {success && (
                    <div className="alert alert-success py-1 mb-2" role="alert">
                        {success}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger py-1 mb-2" role="alert">
                        {error}
                    </div>
                )}

                {previewUrl && (
                    <div className="mb-2">
                        <img
                            src={previewUrl}
                            alt="preview"
                            className="img-fluid img-thumbnail"
                            style={{ maxHeight: 200 }}
                        />
                    </div>
                )}

                <div className="input-group">
                    <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        ref={inputRef}
                        onChange={handleFileChange}
                        disabled={isDisabled || loading}
                    />
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleUpload}
                        disabled={isDisabled || loading}
                    >
                        {loading ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Enviando...
                            </>
                        ) : (
                            "Enviar imagem"
                        )}
                    </button>
                </div>
            </div>
        );
    }
);

export default ProductImageUploader;