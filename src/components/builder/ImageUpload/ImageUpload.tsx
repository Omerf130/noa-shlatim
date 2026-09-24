"use client";

import { Button } from "@/components/ui/Button/Button";
import {
  createObjectUrl,
  revokeObjectUrl,
  validateImageFile,
} from "@/lib/builder/objectUrl";
import type { LocalImageRef } from "@/types/signDesign";
import { Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import styles from "./ImageUpload.module.scss";

type ImageUploadProps = {
  value: LocalImageRef | null;
  onChange: (image: LocalImageRef | null, sourceFile?: File | null) => void;
  hint?: string;
};

export function ImageUpload({ value, onChange, hint }: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const applyFile = useCallback(
    (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      if (value) revokeObjectUrl(value.objectUrl);
      const objectUrl = createObjectUrl(file);
      onChange(
        {
          objectUrl,
          fileName: file.name,
          mimeType: file.type,
        },
        file,
      );
    },
    [onChange, value],
  );

  const onFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) applyFile(file);
    event.target.value = "";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) applyFile(file);
  };

  const remove = () => {
    if (value) revokeObjectUrl(value.objectUrl);
    onChange(null, null);
    setError(null);
  };

  return (
    <div className={styles.root}>
      {hint && <p className={styles.hint}>{hint}</p>}

      {!value ? (
        <div
          className={[styles.dropzone, dragOver ? styles.dragOver : ""]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <Upload size={28} strokeWidth={1.75} aria-hidden className={styles.icon} />
          <p className={styles.dropText}>גררו תמונה לכאן או</p>
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
          >
            בחירת קובץ
          </Button>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className={styles.fileInput}
            onChange={onFileInput}
          />
        </div>
      ) : (
        <div className={styles.previewBlock}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.objectUrl}
            alt={`תצוגה מקדימה של ${value.fileName}`}
            className={styles.previewImg}
          />
          <p className={styles.fileName}>{value.fileName}</p>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => inputRef.current?.click()}>
              החלפת תמונה
            </Button>
            <Button variant="ghost" onClick={remove}>
              הסרה
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className={styles.fileInput}
            onChange={onFileInput}
            aria-label="החלפת תמונה"
          />
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
