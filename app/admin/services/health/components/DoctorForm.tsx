"use client";

import React from "react";
import styled from "styled-components";
import { useFormState, useFormStatus } from "react-dom";
import { createDoctorAction } from "../doctors/actions";

type ActionState = {
  error?: string;
};

type CityOption = {
  id: string;
  name_en: string;
  name_ar: string;
};

type SpecialtyOption = {
  id: number;
  name_en: string;
  name_ar: string;
};

type DoctorFormProps = {
  cities: CityOption[];
  specialties: SpecialtyOption[];
};

type CustomSelectOption = {
  label: string;
  value: string | number;
};

const initialState: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Create Doctor"}
    </button>
  );
}

function CustomSelect({
  options,
  name,
  placeholder,
  required = false,
}: {
  options: CustomSelectOption[];
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | number | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedLabel = options.find(
    (option) => option.value === selected,
  )?.label;

  return (
    <div className={`custom-select ${open ? "active" : ""}`} ref={wrapperRef}>
      <input
        type="hidden"
        name={name}
        value={selected ?? ""}
        required={required}
      />

      <button
        type="button"
        className={`select-box ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={!selected ? "placeholder-text" : ""}>
          {selectedLabel ?? placeholder}
        </span>
      </button>

      {open && (
        <div className="options" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`option ${selected === option.value ? "selected" : ""}`}
              onClick={() => {
                setSelected(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorForm({
  cities,
  specialties,
}: DoctorFormProps) {
  const [selectedFileName, setSelectedFileName] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [state, formAction] = useFormState(
    async (_prevState: ActionState, formData: FormData) => {
      try {
        await createDoctorAction(formData);
        return {};
      } catch (error) {
        return {
          error:
            error instanceof Error ? error.message : "Failed to create doctor",
        };
      }
    },
    initialState,
  );

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
      return;
    }

    setSelectedFileName(file.name);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);
  }

  function handleClearFile() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSelectedFileName("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");
  }

  return (
    <StyledWrapper>
      <form action={formAction} className="form">
        <div id="header-area">
          <p>DOCTOR</p>
        </div>

        {state.error ? <div className="error-box">{state.error}</div> : null}

        <div id="basic-area" className="form-section">
          <div className="section-title">Doctor Basics</div>

          <div className="field-grid">
            <input
              name="full_name_en"
              placeholder="FULL NAME (EN)"
              type="text"
              required
            />

            <CustomSelect
              name="specialty_subcategory_id"
              placeholder="SELECT SPECIALTY"
              required
              options={specialties.map((specialty) => ({
                label: specialty.name_en,
                value: specialty.id,
              }))}
            />

            <CustomSelect
              name="city_id"
              placeholder="SELECT CITY"
              required
              options={cities.map((city) => ({
                label: city.name_en,
                value: city.id,
              }))}
            />

            <input
              name="consultation_fee"
              placeholder="CONSULTATION FEE"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div id="clinic-area" className="form-section">
          <div className="section-title">Clinic Details</div>

          <input
            className="full-width-input"
            name="clinic_address_line"
            placeholder="CLINIC ADDRESS"
            type="text"
          />
        </div>

        <div id="contact-area" className="form-section">
          <div className="section-title">Doctor Contact</div>

          <div className="field-grid">
            <input name="phone" placeholder="DOCTOR PHONE" type="text" />
            <input
              name="whatsapp_number"
              placeholder="DOCTOR WHATSAPP"
              type="text"
            />
          </div>
        </div>

        <div id="photo-area" className="form-section">
          <div className="section-title">Doctor Photo</div>

          <div className="file-upload-wrapper">
            <div className="upload-card">
              <div className="upload-header">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15"
                    stroke="#000000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>Browse File to upload!</p>
              </div>

              <label htmlFor="photo" className="upload-footer">
                <svg
                  fill="currentColor"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.331 6H8.5v20h15V14.154h-8.169z" />
                  <path d="M18.153 6h-.009v5.342H23.5v-.002z" />
                </svg>

                <p>{selectedFileName || "Not selected file"}</p>

                {selectedFileName ? (
                  <button
                    type="button"
                    className="trash-button"
                    onClick={(event) => {
                      event.preventDefault();
                      handleClearFile();
                    }}
                    aria-label="Remove Photo"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M19.5 5H4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </button>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M19.5 5H4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </label>

              <input
                ref={fileInputRef}
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {previewUrl ? (
              <div className="image-preview-card">
                <img
                  src={previewUrl}
                  alt="Doctor preview"
                  className="image-preview"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div id="footer-area">
          <SubmitButton />
        </div>
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background-color: #ffffff;
  padding: 0;

  .form {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    width: 100%;
    border: 2px solid #0f2f6b;
    border-bottom-left-radius: 1.5em;
    border-top-right-radius: 1.5em;
    box-shadow:
      -10px 0px 0px #0f2f6b,
      -10px 5px 5px rgb(0, 0, 0, 0.2);
    overflow: hidden;
    position: relative;
    transition: all 0.25s ease;
    isolation: isolate;
    padding-bottom: 1.5em;
  }

  .form:hover {
    transform: translateY(-2px);
  }

  #header-area,
  .error-box {
    position: relative;
    z-index: 5;
  }

  #basic-area,
  #contact-area,
  #clinic-area,
  #photo-area,
  #bio-area,
  #clinic-description-area,
  #footer-area {
    position: relative;
    z-index: 1;
  }

  #basic-area:has(.custom-select.active),
  #contact-area:has(.custom-select.active),
  #clinic-area:has(.custom-select.active) {
    z-index: 9999;
  }

  #header-area {
    width: 100%;
    height: 5.5em;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  }

  #header-area p {
    top: 0.5em;
    font-size: 1.8em;
    font-weight: bold;
    position: absolute;
    z-index: 5;
    letter-spacing: 0.06em;
  }

  .error-box {
    width: 88%;
    margin-top: 1.2em;
    border-radius: 0.8em;
    padding: 0.9em 1em;
    background: #fff0f1;
    color: #d62839;
    font-size: 0.92em;
    font-weight: bold;
    border: 1px solid #ffc9cf;
  }

  .form-section {
    width: calc(100% - 10%);
    margin-top: 0.9em;
    margin-left: 5%;
    margin-right: 5%;
    padding: 1.25em 1.4em 1.2em;
    border-radius: 1.2em;
    transition: all 0.25s ease;
    background: transparent;
  }

  .section-title {
    margin-bottom: 1em;
    color: #2563eb;
    font-size: 0.95em;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    position: relative;
    z-index: 2;
    transition:
      color 0.25s ease,
      transform 0.25s ease,
      text-shadow 0.25s ease;
  }

  .form-section:hover {
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    box-shadow:
      0px 14px 28px -16px rgba(37, 99, 235, 0.55),
      0px 8px 12px -6px rgba(0, 0, 0, 0.18);
  }

  .form-section:hover .section-title {
    color: white;
    transform: translateY(-2px);
    text-shadow: 0 2px 8px rgb(0, 0, 0, 0.22);
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1em;
  }

  .full-width-input {
    width: 100%;
    margin-top: 0.2em;
  }

  #basic-area input[type="text"],
  #basic-area input[type="number"],
  #contact-area input,
  #clinic-area input,
  #bio-area textarea,
  #clinic-description-area textarea {
    width: 100%;
    border: 2px solid #2563eb;
    border-radius: 0.85em;
    padding: 0 1em;
    font-size: 0.95em;
    font-weight: 700;
    transition: all 0.35s ease;
    outline: none;
    box-shadow:
      0px 8px 18px -10px rgba(37, 99, 235, 0.45),
      0px 5px 5px -3px rgba(0, 0, 0, 0.18);
    color: #1d4ed8;
    background: white;
  }

  #basic-area input[type="text"],
  #basic-area input[type="number"],
  #contact-area input,
  #clinic-area input {
    height: 3.2em;
  }

  .custom-select {
    position: relative;
    width: 100%;
    z-index: 2;
  }

  .select-box {
    width: 100%;
    height: 3.2em;
    display: flex;
    align-items: center;
    padding: 0 1em;
    border-radius: 0.85em;
    border: 2px solid #2563eb;
    background: linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%);
    color: #1d4ed8;
    font-size: 0.95em;
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      0px 8px 18px -10px rgba(37, 99, 235, 0.45),
      0px 5px 5px -3px rgba(0, 0, 0, 0.18);
    transition: all 0.25s ease;
    position: relative;
    text-align: left;
  }

  .placeholder-text {
    color: #2563eb;
  }

  .select-box::after {
    content: "";
    position: absolute;
    right: 1.1em;
    top: 50%;
    width: 0.62em;
    height: 0.62em;
    border-right: 2.5px solid #2563eb;
    border-bottom: 2.5px solid #2563eb;
    transform: translateY(-65%) rotate(45deg);
    transition: all 0.25s ease;
  }

  .select-box:hover,
  .select-box.open {
    color: white;
    border: 2px solid white;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    box-shadow:
      0px 10px 20px -10px rgba(37, 99, 235, 0.55),
      0px 6px 8px -3px rgba(0, 0, 0, 0.2);
  }

  .select-box:hover .placeholder-text,
  .select-box.open .placeholder-text {
    color: white;
  }

  .select-box:hover::after,
  .select-box.open::after {
    border-right-color: white;
    border-bottom-color: white;
  }

  .select-box.open::after {
    transform: translateY(-35%) rotate(-135deg);
  }

  .options {
    position: absolute;
    top: calc(100% + 0.45em);
    left: 0;
    width: 100%;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 1em;
    box-shadow:
      0 25px 50px rgba(0, 0, 0, 0.15),
      0 10px 20px rgba(37, 99, 235, 0.12);
    padding: 0.4em;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
    max-height: 16em;
    overflow-y: auto;
    z-index: 10000;
    animation: dropdownFade 0.18s ease;
  }

  .options::-webkit-scrollbar {
    width: 8px;
  }

  .options::-webkit-scrollbar-track {
    background: #eaf1ff;
    border-radius: 999px;
  }

  .options::-webkit-scrollbar-thumb {
    background: #9bbcff;
    border-radius: 999px;
  }

  .option {
    width: 100%;
    border: none;
    background: #ffffff;
    text-align: left;
    padding: 0.85em 0.95em;
    border-radius: 0.75em;
    color: #123a91;
    font-size: 0.95em;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .option:hover {
    background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
    color: #0f2f6b;
    transform: translateX(3px);
  }

  .option.selected {
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 8px 18px -10px rgba(37, 99, 235, 0.55);
  }

  .file-upload-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .upload-card {
    width: 100%;
    min-height: 260px;
    border-radius: 14px;
    box-shadow: 4px 4px 30px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    gap: 8px;
    background-color: rgba(0, 110, 255, 0.041);
    border: 1px solid rgba(37, 99, 235, 0.12);
  }

  .upload-header {
    flex: 1;
    width: 100%;
    min-height: 180px;
    border: 2px dashed royalblue;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 1em;
    background: rgba(255, 255, 255, 0.65);
  }

  .upload-header svg {
    height: 90px;
    width: 90px;
    margin-bottom: 0.75em;
  }

  .upload-header p {
    text-align: center;
    color: black;
    font-size: 0.98em;
    font-weight: 600;
    margin: 0;
  }

  .upload-footer {
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    width: 100%;
    min-height: 48px;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: #ffffff;
    border: none;
    gap: 10px;
    transition: all 0.25s ease;
  }

  .upload-footer:hover {
    background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
  }

  .upload-footer > svg,
  .trash-button svg {
    height: 22px;
    width: 22px;
    min-width: 22px;
    color: #ffffff;
    fill: currentColor;
    background-color: rgba(255, 255, 255, 0.16);
    border-radius: 50%;
    padding: 2px;
    cursor: pointer;
    box-shadow: 0 2px 30px rgba(0, 0, 0, 0.12);
  }

  .upload-footer p {
    flex: 1;
    text-align: center;
    margin: 0;
    color: #ffffff;
    font-size: 0.92em;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trash-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: #ffffff;
  }

  #photo {
    display: none;
  }

  .image-preview-card {
    width: 100%;
    border: 2px solid #dbeafe;
    border-radius: 1em;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    padding: 0.75em;
    box-shadow:
      0px 8px 18px -10px rgba(37, 99, 235, 0.25),
      0px 5px 5px -3px rgba(0, 0, 0, 0.12);
  }

  .image-preview {
    width: 100%;
    max-height: 240px;
    object-fit: cover;
    border-radius: 0.8em;
    display: block;
  }

  #bio-area,
  #clinic-description-area {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1em;
  }

  #bio-area textarea,
  #clinic-description-area textarea {
    min-height: 8.5em;
    padding: 1em;
    resize: vertical;
  }

  #basic-area input[type="text"]:hover,
  #basic-area input[type="text"]:focus,
  #basic-area input[type="number"]:hover,
  #basic-area input[type="number"]:focus,
  #contact-area input:hover,
  #contact-area input:focus,
  #clinic-area input:hover,
  #clinic-area input:focus {
    color: white;
    border: 2px solid white;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    height: 3.25em;
  }

  #basic-area input[type="text"]:hover::placeholder,
  #basic-area input[type="text"]:focus::placeholder,
  #basic-area input[type="number"]:hover::placeholder,
  #basic-area input[type="number"]:focus::placeholder,
  #contact-area input:hover::placeholder,
  #contact-area input:focus::placeholder,
  #clinic-area input:hover::placeholder,
  #clinic-area input:focus::placeholder {
    color: white;
  }

  #footer-area {
    width: calc(100% - 10%);
    margin: 1.1em 5% 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    transition: all 0.25s ease;
  }

  #footer-area button[type="submit"] {
    width: 100%;
    border: 2px solid #2563eb;
    border-radius: 0.85em;
    height: 3.1em;
    padding-left: 1em;
    font-size: 0.98em;
    transition: all 0.25s ease;
    color: white;
    font-weight: bold;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    box-shadow:
      0px 10px 18px -10px rgba(37, 99, 235, 0.55),
      0px 5px 5px -3px rgba(0, 0, 0, 0.2);
  }

  #footer-area button[type="submit"]:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  #footer-area button[type="submit"]:active:not(:disabled) {
    color: #2563eb;
    background: white;
    width: 96%;
  }

  #footer-area:hover button[type="submit"] {
    border: 2px solid white;
    background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
    height: 3.2em;
  }

  ::placeholder {
    color: #2563eb;
    font-weight: bold;
  }

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 900px) {
    .field-grid {
      grid-template-columns: 1fr;
    }

    .form-section {
      width: calc(100% - 8%);
      margin-left: 4%;
      margin-right: 4%;
      padding: 1.1em 1em;
    }

    #footer-area {
      width: calc(100% - 8%);
      margin-left: 4%;
      margin-right: 4%;
    }

    .upload-card {
      min-height: 240px;
    }

    .upload-header {
      min-height: 160px;
    }

    .upload-header svg {
      height: 72px;
      width: 72px;
    }
  }
`;